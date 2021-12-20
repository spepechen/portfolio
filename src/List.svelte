<script>
	import { slide } from "svelte/transition";
	export let group
	let isOpen = false
	const toggle = () => isOpen = !isOpen

</script>

<button on:click={toggle} aria-expanded={isOpen}>
    <svg style="tran"  width="20" height="20" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"></path></svg> 
    {#if group[0] === "MVTEC"}    
     Master’s Degree in Visual Tools to Empower Citizens
    {:else}
    {group[0]}

    {/if}
</button>

{#if isOpen}
<section class="archive" transition:slide={{ duration: 300 }}>
	{#each group[1] as item}
	<p class='date'>{item.pubDate.replaceAll('/', '.')}</p>
    <p>
        <a href={item.link}>
            {item.headlineEn}
        </a>
    </p>
	{/each}
</section>
{/if}


<style>

	button {
        position: -webkit-sticky; /* Safari */
        position: sticky;
        top: 0;
        border: none; 
        background: white;
        display:block; 
        color: inherit; 
        cursor: pointer; 
        /* padding-bottom: 0.5em;  */
        /* padding-top: 0.5em; */
        font-family: 'ZCOOL XiaoWei', serif;
        font-size: 1.25rem; 
        padding-left: 0;
        width: 100%;
        text-align: left;
    }

	svg { transition: transform 0.2s ease-in;
        transform: translateY(4px);
	}
	
	[aria-expanded=true] svg { transform: rotate(0.25turn); }

section {
    max-width: 900px;
    display: grid;
    grid-template-columns: 10% 70%;
    /* grid-template-rows: 25% 100px auto; */
    column-gap:73px;
    padding: .75rem;
    font-size: 1rem;
    margin-left: 0.75rem;
    }

    @media only screen and (min-width: 600px) {
        section{
        grid-template-columns: 15% 50%;
        /* grid-template-rows: 25% 100px auto; */
        column-gap: 10px;

    }
}


a{
    border-bottom: 3px solid;
    border-image: linear-gradient(to left, rgb(255,249,248) 1%, rgb(255,152,114)100%);
    border-image-slice: 1;
}

p{
    line-height: 1.5em;
}

.date{
    color: rgb(116, 116, 116);
}
</style>
