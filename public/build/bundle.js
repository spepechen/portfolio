
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/List.svelte generated by Svelte v3.44.3 */
    const file$5 = "src/List.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (13:4) {:else}
    function create_else_block$1(ctx) {
    	let t_value = /*group*/ ctx[0][0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*group*/ 1 && t_value !== (t_value = /*group*/ ctx[0][0] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if group[0] === "MVTEC"}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Master’s Degree in Visual Tools to Empower Citizens");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(11:4) {#if group[0] === \\\"MVTEC\\\"}",
    		ctx
    	});

    	return block;
    }

    // (19:0) {#if isOpen}
    function create_if_block$1(ctx) {
    	let section;
    	let section_transition;
    	let current;
    	let each_value = /*group*/ ctx[0][1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(section, "class", "archive svelte-11epix0");
    			add_location(section, file$5, 19, 0, 548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*group*/ 1) {
    				each_value = /*group*/ ctx[0][1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!section_transition) section_transition = create_bidirectional_transition(section, slide, { duration: 300 }, true);
    				section_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!section_transition) section_transition = create_bidirectional_transition(section, slide, { duration: 300 }, false);
    			section_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			if (detaching && section_transition) section_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(19:0) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (21:1) {#each group[1] as item}
    function create_each_block$2(ctx) {
    	let p0;
    	let t0_value = /*item*/ ctx[3].pubDate.replaceAll('/', '.') + "";
    	let t0;
    	let t1;
    	let p1;
    	let a;
    	let t2_value = /*item*/ ctx[3].headlineEn + "";
    	let t2;
    	let a_href_value;
    	let t3;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p0, "class", "date svelte-11epix0");
    			add_location(p0, file$5, 21, 1, 638);
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[3].link);
    			attr_dev(a, "class", "svelte-11epix0");
    			add_location(a, file$5, 23, 8, 710);
    			attr_dev(p1, "class", "svelte-11epix0");
    			add_location(p1, file$5, 22, 4, 698);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, a);
    			append_dev(a, t2);
    			append_dev(p1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*group*/ 1 && t0_value !== (t0_value = /*item*/ ctx[3].pubDate.replaceAll('/', '.') + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*group*/ 1 && t2_value !== (t2_value = /*item*/ ctx[3].headlineEn + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*group*/ 1 && a_href_value !== (a_href_value = /*item*/ ctx[3].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(21:1) {#each group[1] as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let button;
    	let svg;
    	let path;
    	let t0;
    	let t1;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*group*/ ctx[0][0] === "MVTEC") return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*isOpen*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(path, "d", "M9 5l7 7-7 7");
    			add_location(path, file$5, 9, 164, 356);
    			attr_dev(svg, "style", "tran");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "svelte-11epix0");
    			add_location(svg, file$5, 9, 4, 196);
    			attr_dev(button, "aria-expanded", /*isOpen*/ ctx[1]);
    			attr_dev(button, "class", "svelte-11epix0");
    			add_location(button, file$5, 8, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t0);
    			if_block0.m(button, null);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggle*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, null);
    				}
    			}

    			if (!current || dirty & /*isOpen*/ 2) {
    				attr_dev(button, "aria-expanded", /*isOpen*/ ctx[1]);
    			}

    			if (/*isOpen*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*isOpen*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block0.d();
    			if (detaching) detach_dev(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	let { group } = $$props;
    	let isOpen = false;
    	const toggle = () => $$invalidate(1, isOpen = !isOpen);
    	const writable_props = ['group'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('group' in $$props) $$invalidate(0, group = $$props.group);
    	};

    	$$self.$capture_state = () => ({ slide, group, isOpen, toggle });

    	$$self.$inject_state = $$props => {
    		if ('group' in $$props) $$invalidate(0, group = $$props.group);
    		if ('isOpen' in $$props) $$invalidate(1, isOpen = $$props.isOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [group, isOpen, toggle];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { group: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*group*/ ctx[0] === undefined && !('group' in props)) {
    			console.warn("<List> was created without expected prop 'group'");
    		}
    	}

    	get group() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/GridItem.svelte generated by Svelte v3.44.3 */

    const file$4 = "src/GridItem.svelte";

    function create_fragment$4(ctx) {
    	let li;
    	let h3;
    	let t1;
    	let figure;
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			h3 = element("h3");
    			h3.textContent = "Remembering the 5 million lives lost to Covid-19";
    			t1 = space();
    			figure = element("figure");
    			a = element("a");
    			img = element("img");
    			add_location(h3, file$4, 4, 8, 54);
    			if (!src_url_equal(img.src, img_src_value = "http://spepechen.github.io/img/covid-flowers.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 7, 13, 257);
    			attr_dev(a, "href", "https://www.straitstimes.com/multimedia/graphics/2021/10/covid19-5million-deaths/index.html");
    			add_location(a, file$4, 6, 12, 141);
    			add_location(figure, file$4, 5, 8, 120);
    			add_location(li, file$4, 3, 4, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, h3);
    			append_dev(li, t1);
    			append_dev(li, figure);
    			append_dev(figure, a);
    			append_dev(a, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GridItem', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GridItem> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class GridItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GridItem",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Grid.svelte generated by Svelte v3.44.3 */
    const file$3 = "src/Grid.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (11:8) {#if d.featured !== '' && orgList.includes(d.org)}
    function create_if_block(ctx) {
    	let li;
    	let figure;
    	let a0;
    	let img;
    	let img_src_value;
    	let a0_href_value;
    	let t0;
    	let figcaption;
    	let h3;
    	let a1;
    	let t1_value = /*d*/ ctx[3].headlineEnShort + "";
    	let t1;
    	let a1_href_value;
    	let t2;
    	let p;
    	let t3;

    	function select_block_type(ctx, dirty) {
    		if (/*d*/ ctx[3].org !== "MVTEC") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			figure = element("figure");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			figcaption = element("figcaption");
    			h3 = element("h3");
    			a1 = element("a");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			if_block.c();
    			t3 = space();
    			if (!src_url_equal(img.src, img_src_value = /*d*/ ctx[3].imgLink)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 14, 21, 372);
    			attr_dev(a0, "href", a0_href_value = /*d*/ ctx[3].link);
    			attr_dev(a0, "class", "svelte-193l882");
    			add_location(a0, file$3, 13, 20, 333);
    			attr_dev(a1, "href", a1_href_value = /*d*/ ctx[3].link);
    			attr_dev(a1, "class", "svelte-193l882");
    			add_location(a1, file$3, 19, 28, 518);
    			attr_dev(h3, "class", "svelte-193l882");
    			add_location(h3, file$3, 18, 24, 485);
    			attr_dev(figcaption, "class", "svelte-193l882");
    			add_location(figcaption, file$3, 17, 21, 448);
    			attr_dev(figure, "class", "svelte-193l882");
    			add_location(figure, file$3, 12, 16, 304);
    			attr_dev(p, "class", "svelte-193l882");
    			add_location(p, file$3, 25, 16, 723);
    			add_location(li, file$3, 11, 12, 267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, figure);
    			append_dev(figure, a0);
    			append_dev(a0, img);
    			append_dev(figure, t0);
    			append_dev(figure, figcaption);
    			append_dev(figcaption, h3);
    			append_dev(h3, a1);
    			append_dev(a1, t1);
    			append_dev(li, t2);
    			append_dev(li, p);
    			if_block.m(p, null);
    			append_dev(li, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && !src_url_equal(img.src, img_src_value = /*d*/ ctx[3].imgLink)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*data*/ 1 && a0_href_value !== (a0_href_value = /*d*/ ctx[3].link)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*d*/ ctx[3].headlineEnShort + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data*/ 1 && a1_href_value !== (a1_href_value = /*d*/ ctx[3].link)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:8) {#if d.featured !== '' && orgList.includes(d.org)}",
    		ctx
    	});

    	return block;
    }

    // (32:20) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*d*/ ctx[3].tag.split(',');
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*d*/ ctx[3].tag.split(',');
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(32:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:20) {#if d.org !== "MVTEC"}
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = /*d*/ ctx[3].note + "";
    	let t1;
    	let if_block = /*d*/ ctx[3].award !== "" && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*d*/ ctx[3].award !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*d*/ ctx[3].note + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(27:20) {#if d.org !== \\\"MVTEC\\\"}",
    		ctx
    	});

    	return block;
    }

    // (33:24) {#each d.tag.split(',') as t}
    function create_each_block_1(ctx) {
    	let div;
    	let t0_value = /*t*/ ctx[6] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "tag svelte-193l882");
    			add_location(div, file$3, 33, 28, 1054);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*t*/ ctx[6] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(33:24) {#each d.tag.split(',') as t}",
    		ctx
    	});

    	return block;
    }

    // (28:24) {#if d.award !== ""}
    function create_if_block_2(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*d*/ ctx[3].award + "";
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("🎖️ ");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "award svelte-193l882");
    			add_location(span, file$3, 28, 24, 840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*d*/ ctx[3].award + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(28:24) {#if d.award !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#each data as d}
    function create_each_block$1(ctx) {
    	let show_if = /*d*/ ctx[3].featured !== '' && /*orgList*/ ctx[1].includes(/*d*/ ctx[3].org);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, orgList*/ 3) show_if = /*d*/ ctx[3].featured !== '' && /*orgList*/ ctx[1].includes(/*d*/ ctx[3].org);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(10:4) {#each data as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let ul;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "project svelte-193l882");
    			add_location(ul, file$3, 8, 0, 153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data, orgList*/ 3) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Grid', slots, []);
    	let cats = Array.from(Array(10).keys());
    	let { data } = $$props;
    	let { orgList } = $$props;
    	const writable_props = ['data', 'orgList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('orgList' in $$props) $$invalidate(1, orgList = $$props.orgList);
    	};

    	$$self.$capture_state = () => ({ GridItem, cats, data, orgList });

    	$$self.$inject_state = $$props => {
    		if ('cats' in $$props) cats = $$props.cats;
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('orgList' in $$props) $$invalidate(1, orgList = $$props.orgList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, orgList];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, orgList: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<Grid> was created without expected prop 'data'");
    		}

    		if (/*orgList*/ ctx[1] === undefined && !('orgList' in props)) {
    			console.warn("<Grid> was created without expected prop 'orgList'");
    		}
    	}

    	get data() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orgList() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orgList(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Hero.svelte generated by Svelte v3.44.3 */

    const file$2 = "src/Hero.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let h1;
    	let t0;
    	let span0;
    	let t1;
    	let em;
    	let t3;
    	let div1;
    	let p;
    	let t4;
    	let span1;
    	let t6;
    	let span2;
    	let t8;
    	let div0;
    	let a0;
    	let t10;
    	let br;
    	let t11;
    	let a1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			t0 = text("Spe Chen\n        ");
    			span0 = element("span");
    			t1 = text("pronounced as the first syllable in ");
    			em = element("em");
    			em.textContent = "\"special\"";
    			t3 = space();
    			div1 = element("div");
    			p = element("p");
    			t4 = text("I design, code, and crunch data for storytelling at The Straits Times ");
    			span1 = element("span");
    			span1.textContent = "🇸🇬";
    			t6 = text(". Past stint in newsrooms in ");
    			span2 = element("span");
    			span2.textContent = "🇹🇼 🇺🇸 🇨🇳";
    			t8 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "spepe.chen_at_gmail.com";
    			t10 = space();
    			br = element("br");
    			t11 = space();
    			a1 = element("a");
    			a1.textContent = "@spepechen";
    			add_location(em, file$2, 7, 63, 152);
    			attr_dev(span0, "class", "note svelte-1w9os7i");
    			add_location(span0, file$2, 7, 8, 97);
    			attr_dev(h1, "class", "svelte-1w9os7i");
    			add_location(h1, file$2, 5, 4, 51);
    			attr_dev(span1, "class", "emoji svelte-1w9os7i");
    			add_location(span1, file$2, 11, 78, 304);
    			attr_dev(span2, "class", "emoji svelte-1w9os7i");
    			add_location(span2, file$2, 11, 138, 364);
    			attr_dev(p, "class", "svelte-1w9os7i");
    			add_location(p, file$2, 10, 8, 208);
    			attr_dev(a0, "href", "");
    			attr_dev(a0, "class", "svelte-1w9os7i");
    			add_location(a0, file$2, 14, 12, 461);
    			add_location(br, file$2, 14, 51, 500);
    			attr_dev(a1, "href", "https://twitter.com/spepechen");
    			attr_dev(a1, "class", "svelte-1w9os7i");
    			add_location(a1, file$2, 14, 56, 505);
    			attr_dev(div0, "class", "contact svelte-1w9os7i");
    			add_location(div0, file$2, 13, 8, 427);
    			add_location(div1, file$2, 9, 4, 192);
    			attr_dev(section, "class", "project svelte-1w9os7i");
    			add_location(section, file$2, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span0);
    			append_dev(span0, t1);
    			append_dev(span0, em);
    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(p, span1);
    			append_dev(p, t6);
    			append_dev(p, span2);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t10);
    			append_dev(div0, br);
    			append_dev(div0, t11);
    			append_dev(div0, a1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hero', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.44.3 */

    const file$1 = "src/Footer.svelte";

    function create_fragment$1(ctx) {
    	let hr;
    	let t0;
    	let footer;
    	let p;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Updated on Dec 20, 2021";
    			add_location(hr, file$1, 0, 0, 0);
    			attr_dev(p, "class", "svelte-rx4l8g");
    			add_location(p, file$1, 2, 4, 18);
    			attr_dev(footer, "class", "svelte-rx4l8g");
    			add_location(footer, file$1, 1, 0, 5);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var rawData = [ { pubDate:"2021/10/30",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"Remembering the 5 million lives lost to Covid-19",
        headlineEnShort:"5 Million Lives Lost to Covid-19",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/10/covid19-5million-deaths/index.html",
        imgLink:"https://spepechen.github.io/img/covid-flowers.png",
        award:"",
        note:"Breaking emotional numbness towards the pandemic's toll with floral data viz. It was my first time experimenting with the combination of Arquero, D3 and Observable." },
      { pubDate:"2021/10/17",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Down with Delta: Recovered Covid-19 patients in S’pore tell their stories",
        headlineEnShort:"Down with Delta: Recovered Covid-19 patients in S’pore tell their stories",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/singapore/covid19-recovery",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2021/7/24",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"The Champion’s Challenge",
        headlineEnShort:"The Champion’s Challenge",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/07/joseph-schooling-champions-challenge/index.html",
        imgLink:"https://spepechen.github.io/img/schooling.jpg",
        award:"",
        note:"Take a deep dive into Singapore's first-ever Olympics gold medalist's butterfly technique with visual annotations and video commentaries from the swimmer and the national coach." },
      { pubDate:"2021/5/5",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Bukit Merah View market and other Covid-19 clusters in S’pore: What we know so far",
        headlineEnShort:"Bukit Merah View market and other Covid-19 clusters in S’pore: What we know so far",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/05/singapore-covid19-clusters/index.html?stextension",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2021/3/20",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"Fukushima disaster 10 years on: How long will it take to clean up the nuclear waste?",
        headlineEnShort:"Fukushima Disaster 10 years on",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/03/fukushima/index.html",
        imgLink:"https://spepechen.github.io/img/fukushima.jpg",
        award:"",
        note:"A rare chance for me to be able to wrap anecdotes with data, maps and satellite img timelapse." },
      { pubDate:"2021/2/28",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Covid-19: Tracking the global race to vaccinate\r",
        headlineEnShort:"Covid-19: Tracking the global race to vaccinate\r",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/02/covid-vaccine-rollout/index.html?stextension",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2021/2/28",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"The Great Singapore Cycle\r",
        headlineEnShort:"The Great Singapore Cycle\r",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2021/02/great-singapore-cycle/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2020/12/19",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"30 and under: Young Singaporeans to watch",
        headlineEnShort:"30 and under: Young Singaporeans to watch",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/12/30-young-singaporeans/index.html",
        imgLink:"https://spepechen.github.io/img/30-under-30.jpg",
        award:"",
        note:"" },
      { pubDate:"2020/12/19",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"30 and under: Young Asians to watch",
        headlineEnShort:"30 and under: Young Asians to watch",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/12/30-young-asians/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2020/10/30",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"The Great S’pore Drive: Take a 200km road trip without leaving the country",
        headlineEnShort:"The Great S’pore Drive",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/10/great-singapore-drive/index.html",
        imgLink:"https://spepechen.github.io/img/sg-drive.jpg",
        award:"SND 42 - Award of Excellence, ST Newscon 2020 - Special Awards for Excellence",
        note:"Found my last piece of the SVG puzzle - the workflow from exporting artwork from illustrator to supplying the interactivity. Sparkling clean layers are the key." },
      { pubDate:"2020/10/27",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Trump v Biden 2020",
        headlineEnShort:"Trump v Biden 2020",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/10/trump-biden/index.html",
        imgLink:"",
        award:"",
        note:"Experimented with various cropping and layout formats for a visual-driven/Instagram-story-like piece. Coloring in Adobe Premier adds a nice touch to footages." },
      { pubDate:"2020/9/26",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Covid-19 through my eyes",
        headlineEnShort:"Covid-19 through my eyes",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/09/covid-stories/index.html",
        imgLink:"",
        award:"ST Newscon 2020 - Cross-media of the Year",
        note:"" },
      { pubDate:"2020/8/23",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Singapore’s 14th Parliament: Get to know your MPs",
        headlineEnShort:"Singapore’s 14th Parliament: Get to know your MPs",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/08/singapore-14th-parliament/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2020/7/7",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"Singapore GE2020: New faces, old-timers and quite a few lawyers",
        headlineEnShort:"S’pore GE2020 Candidate Analysis",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/07/singapore-general-election-ge2020-candidates-backgrounds/index.html",
        imgLink:"https://spepechen.github.io/img/candidates-bg.jpg",
        award:"SND 42 - Award of Excellence",
        note:"Pitched a “You Draw It” news quiz that challenges readers’ knowledge of the all-too-familiar candidates. I grew some white hair for this data graphics + interactivity’s mobile version." },
      { pubDate:"2020/6/30",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"Battleground Singapore: Get to know your GE2020 candidates",
        headlineEnShort:"S’pore GE2020 Voting Guide",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/06/singapore-general-election-ge2020-candidates/index.html",
        imgLink:"https://spepechen.github.io/img/ge-candidates.jpg",
        award:"",
        note:"I optimized the workflow of processing headshots of multiple sources by a small Python script to give the page a uniform clean look, and conducted user interviews prior to designing the page." },
      { pubDate:"2020/5/25",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"How Covid-19 is changing what Singaporeans shop for online",
        headlineEnShort:"How Covid-19 is changing what Singaporeans shop for online",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/singapore/covid-shopping",
        imgLink:"",
        award:"",
        note:"Google trends data came in handy when I created these charts to show Singaporeans’ craze for bubble tea." },
      { pubDate:"2020/2/6",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Coronavirus cases in Singapore: What we know so far",
        headlineEnShort:"Coronavirus cases in Singapore: What we know so far",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2020/02/spore-virus-cases/index.html?stextension",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/12/11",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"1",
        headlineEn:"When it begins to look a lot like Christmas... as revealed by listeners on Spotify",
        headlineEnShort:"Christmas Song Queen",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/when-it-begins-to-look-a-lot-like-christmas-as-revealed-by-listeners-on-spotify",
        imgLink:"https://spepechen.github.io/img/xmas.jpg",
        award:"",
        note:"The world’s annual obsession on Mariah Carey’s All I Want for Christmas is You starts as early as…guess what...late October!" },
      { pubDate:"2019/12/1",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"South-east Asia's meth menace: One man's struggle",
        headlineEnShort:"South-east Asia's meth menace: One man's struggle",
        tag:"",
        headlineCh:"",
        link:"https://www.straitstimes.com/multimedia/graphics/2019/11/south-east-asia-meth-menace/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/10/6",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"A city divided, a mother's anguish",
        headlineEnShort:"A city divided, a mother's anguish",
        tag:"",
        headlineCh:"",
        link:"https://graphics.straitstimes.com/STI/STIMEDIA/Interactives/2019/10/hkfamily/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/9/8",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"Singapore GE: Which are the constituencies that may be redrawn?",
        headlineEnShort:"Singapore GE: Which are the constituencies that may be redrawn?",
        tag:"",
        headlineCh:"",
        link:"https://graphics.straitstimes.com/STI/STIMEDIA/Interactives/2019/09/SingaporeGE-constituencies/",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/8/11",
        publication:"Straits Times",
        org:"Straits Times",
        featured:"",
        headlineEn:"How ready are you to live with AI?",
        headlineEnShort:"How ready are you to live with AI?",
        tag:"",
        headlineCh:"",
        link:"https://graphics.straitstimes.com/STI/STIMEDIA/Interactives/2019/08/how-ready-are-you-to-live-with-ai/index.html",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/3/22",
        publication:"Tencent News",
        org:"Freelance",
        featured:"",
        headlineEn:"China’s Happiness Paradox",
        headlineEnShort:"China’s Happiness Paradox",
        tag:"",
        headlineCh:"联合国说你没去年幸福，有钱还不够幸福 ",
        link:"https://mp.weixin.qq.com/s/PO_F2AZbqsy62BPlqXRQYg",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2019/2/19",
        publication:"The Paper",
        org:"Freelance",
        featured:"1",
        headlineEn:"An Illustrated Guide to the Rise and Fall of China's Bike Sharing Empires",
        headlineEnShort:"China's Bike Sharing Empires",
        tag:"",
        headlineCh:"图绘 | 这条“生命线”，记录了共享单车三年成败史",
        link:"https://www.thepaper.cn/newsDetail_forward_3005387",
        imgLink:"https://spepechen.github.io/img/bike.jpg",
        award:"",
        note:"I got a chance to sell the idea of combining doodles and charts for a major business story." },
      { pubDate:"2018/12/6",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"How an A-list superstar Fan Bingbing's Tax Fraud Scandal Affected Film and TV industry in Khorgas, Xinjiang",
        headlineEnShort:"How an A-list superstar Fan Bingbing's Tax Fraud Scandal Affected Film and TV industry in Khorgas, Xinjiang",
        tag:"",
        headlineCh:"有多少明星通过合法避税赚钱？政策的羊毛能被薅多久？",
        link:"https://mp.weixin.qq.com/s/RpkNUJizfg3jb9dQp-q7yQ",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2018/6/15",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"Pick your Mr. Soccer",
        headlineEnShort:"Pick your Mr. Soccer",
        tag:"",
        headlineCh:"Pick足球先生",
        link:"https://news.qq.com/zt2018/footballer/index.htm",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2018/05/12",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"10 years after Wenchuan earthquake: Rebuilding home and lives",
        headlineEnShort:"10 years after Wenchuan earthquake: Rebuilding home and lives",
        tag:"",
        headlineCh:"汶川的孩子",
        link:"https://news.qq.com/zt2018/wchildren",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2018/2/11",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"Unravelling 1000 child trafficking routes in China",
        headlineEnShort:"Unravelling 1000 child trafficking routes in China",
        tag:"",
        headlineCh:"宝贝，我们等你回家过年－－图解十年千位儿童的被拐路线",
        link:"https://mp.weixin.qq.com/s/cm1kkdiSFoGW4CsLIyNjfw",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2018/2/9",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"Chinese slow trains in the era of high-speed",
        headlineEnShort:"Chinese slow trains in the era of high-speed",
        tag:"",
        headlineCh:"快時代的慢火車",
        link:"https://news.qq.com/topic/train_story.htm",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2018/2/1",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"1",
        headlineEn:"How the Number of China’s Train Stations Has Doubled in a Decade ",
        headlineEnShort:"China's 2207 Train Stations",
        tag:"",
        headlineCh:"中国2207个火车站的十年进化",
        link:"https://news.qq.com/zt2018/slowTrain/",
        imgLink:"https://spepechen.github.io/img/train.jpg",
        award:"",
        note:"I created polar charts in MATLAB to show the number of trains that originate from the selected station and the angles are corresponding to the coordinates of the start and the destination." },
      { pubDate:"2017/07/14",
        publication:"Tencent News",
        org:"Dataviz.cn",
        featured:"",
        headlineEn:"Beijing's school district housing fever",
        headlineEnShort:"Beijing's school district housing fever",
        tag:"",
        headlineCh:"圖解學區房",
        link:"https://news.qq.com/zt2017/xqfstory/data.htm",
        imgLink:"",
        award:"2017 Kantar Information is Beautiful - Long list",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"Spain Vaccination Tracker ",
        headlineEnShort:"Spain Vaccination Tracker ",
        tag:"Pandas, D3, Svelte",
        headlineCh:"",
        link:"https://covid-vaccination-tracker.vercel.app/",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/tracker.png",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"All you \"knit\" is help!",
        headlineEnShort:"All You \"Knit\" is Help!",
        tag:"D3, Svelte",
        headlineCh:"",
        link:"https://mvtec-google-workshop-cornsilk.vercel.app/",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/knit.png",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"60 Days of My Life",
        headlineEnShort:"60 Days of My Life",
        tag:"D3, Svelte",
        headlineCh:"",
        link:"https://60-days.vercel.app/",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/60days.png",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"A bird-eye view tour around Taiwan",
        headlineEnShort:"Bird-eye View Tour around Taiwan",
        tag:"Mapbox, EO browser",
        headlineCh:"",
        link:"https://spe.neocities.org/carto/index.html",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/sunmoonlake.png",
        award:"",
        note:"Custom scripts in EO browser" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"Cooperació catalana",
        headlineEnShort:"Cooperació Catalana",
        tag:"D3, Svelte",
        headlineCh:"",
        link:"https://cooperacio-spepechen.vercel.app/",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/sankey.png",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"1",
        headlineEn:"Independent Cinema Spaces in Asia",
        headlineEnShort:"Independent Cinema Spaces in Asia",
        tag:"Svelte",
        headlineCh:"",
        link:"https://nang-magazine-laurarago.vercel.app/",
        imgLink:"https://raw.githubusercontent.com/spepechen/spepechen.github.io/master/img/cinema.png",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"",
        headlineEn:"Citizen Centric Project: Proposal to better communicate how Singapore government use citizens' biometric data for digital services",
        headlineEnShort:"Citizen Centric Project: Proposal to better communicate how Singapore government use citizens' biometric data for digital services",
        tag:"",
        headlineCh:"",
        link:"https://docs.google.com/presentation/d/1AOvCfTyOqvVeh17c2ZDCGBRY6uXkKWm0b0bYI1fvho8/edit?usp=sharing",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"",
        headlineEn:"D3 practices in Observable notebooks",
        headlineEnShort:"D3 practices in Observable notebooks",
        tag:"",
        headlineCh:"",
        link:"https://observablehq.com/collection/@spepechen/mvtec",
        imgLink:"",
        award:"",
        note:"" },
      { pubDate:"2020-2021",
        publication:"MVTEC",
        org:"MVTEC",
        featured:"",
        headlineEn:"Other course works",
        headlineEnShort:"Other course works",
        tag:"",
        headlineCh:"",
        link:"https://www.notion.so/Spe-s-portfolio-51c898c0a7e34626a7fb927a4b39f5b1",
        imgLink:"",
        award:"",
        note:"" } ];

    /* src/App.svelte generated by Svelte v3.44.3 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (53:2) {#each Object.entries(groups) as group}
    function create_each_block(ctx) {
    	let list;
    	let current;

    	list = new List({
    			props: { group: /*group*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(list.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(53:2) {#each Object.entries(groups) as group}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let hero;
    	let t0;
    	let h20;
    	let t1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let grid0;
    	let t3;
    	let section0;
    	let h21;
    	let t4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let grid1;
    	let t6;
    	let section1;
    	let h22;
    	let t8;
    	let t9;
    	let footer;
    	let current;
    	hero = new Hero({ $$inline: true });

    	grid0 = new Grid({
    			props: {
    				data: rawData,
    				orgList: /*orgFullList*/ ctx[1].filter(func)
    			},
    			$$inline: true
    		});

    	grid1 = new Grid({
    			props: {
    				data: rawData,
    				orgList: /*orgFullList*/ ctx[1].filter(func_1)
    			},
    			$$inline: true
    		});

    	let each_value = Object.entries(/*groups*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(hero.$$.fragment);
    			t0 = space();
    			h20 = element("h2");
    			t1 = text("Work Projects I ");
    			img0 = element("img");
    			t2 = space();
    			create_component(grid0.$$.fragment);
    			t3 = space();
    			section0 = element("section");
    			h21 = element("h2");
    			t4 = text("School Works I ");
    			img1 = element("img");
    			t5 = space();
    			create_component(grid1.$$.fragment);
    			t6 = space();
    			section1 = element("section");
    			h22 = element("h2");
    			h22.textContent = "All projects created at...";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			create_component(footer.$$.fragment);
    			if (!src_url_equal(img0.src, img0_src_value = "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/samsung/312/black-heart_1f5a4.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "enlarge animate svelte-19niw63");
    			add_location(img0, file, 36, 21, 691);
    			add_location(h20, file, 36, 1, 671);
    			if (!src_url_equal(img1.src, img1_src_value = "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/openmoji/292/black-star_2605.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "vert-move animate svelte-19niw63");
    			add_location(img1, file, 43, 21, 958);
    			add_location(h21, file, 43, 2, 939);
    			attr_dev(section0, "class", "svelte-19niw63");
    			add_location(section0, file, 42, 1, 927);
    			add_location(h22, file, 51, 2, 1221);
    			attr_dev(section1, "class", "svelte-19niw63");
    			add_location(section1, file, 50, 1, 1209);
    			attr_dev(main, "class", "svelte-19niw63");
    			add_location(main, file, 34, 0, 654);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(hero, main, null);
    			append_dev(main, t0);
    			append_dev(main, h20);
    			append_dev(h20, t1);
    			append_dev(h20, img0);
    			append_dev(main, t2);
    			mount_component(grid0, main, null);
    			append_dev(main, t3);
    			append_dev(main, section0);
    			append_dev(section0, h21);
    			append_dev(h21, t4);
    			append_dev(h21, img1);
    			append_dev(section0, t5);
    			mount_component(grid1, section0, null);
    			append_dev(main, t6);
    			append_dev(main, section1);
    			append_dev(section1, h22);
    			append_dev(section1, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section1, null);
    			}

    			append_dev(main, t9);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, groups*/ 1) {
    				each_value = Object.entries(/*groups*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(grid0.$$.fragment, local);
    			transition_in(grid1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(grid0.$$.fragment, local);
    			transition_out(grid1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(hero);
    			destroy_component(grid0);
    			destroy_component(grid1);
    			destroy_each(each_blocks, detaching);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = d => d !== "MVTEC";
    const func_1 = d => d === "MVTEC";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	console.log(rawData);

    	let groupBy = function (xs, key) {
    		return xs.reduce(
    			function (rv, x) {
    				(rv[x[key]] = rv[x[key]] || []).push(x);
    				return rv;
    			},
    			{}
    		);
    	};

    	let groups = groupBy(rawData, 'org');
    	console.log(Object.keys(groups));
    	let orgFullList = Object.keys(groups);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		List,
    		Grid,
    		Hero,
    		Footer,
    		rawData,
    		groupBy,
    		groups,
    		orgFullList
    	});

    	$$self.$inject_state = $$props => {
    		if ('groupBy' in $$props) groupBy = $$props.groupBy;
    		if ('groups' in $$props) $$invalidate(0, groups = $$props.groups);
    		if ('orgFullList' in $$props) $$invalidate(1, orgFullList = $$props.orgFullList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [groups, orgFullList];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Spe'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
