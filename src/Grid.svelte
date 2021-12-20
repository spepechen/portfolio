<script>
    import GridItem from './GridItem.svelte'
    let cats = Array.from(Array(10).keys())
    export let data
    export let orgList

</script>

<ul class="project">
    {#each data as d}
        {#if d.featured !== '' && orgList.includes(d.org)}
            <li>                
                <figure>
                    <a href={d.link}>
                     <img src={d.imgLink} alt="">
                    </a>

                     <figcaption>
                        <h3>
                            <a href={d.link}>
                            {d.headlineEnShort}
                            </a>
                        </h3>
                    </figcaption>
                </figure>
                <p>
                    {#if d.org !== "MVTEC"}
                        {#if d.award !== ""}
                        <span class='award'>🎖️ {d.award}</span>
                        {/if}
                        {d.note}
                    {:else}
                        {#each d.tag.split(',') as t}
                            <div class='tag'>
                                {t}
                            </div>
                        {/each}
                    {/if}
                </p>

            </li>
        {/if}
    {/each}
</ul>
<style>

ul {
  list-style-type: none; /* Remove bullets */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  grid-gap: 2rem;
  padding:0;
}

figure {
display: flex;
justify-content: center;
margin: auto;
max-height: 280px;
overflow: hidden;
/* border-top-left-radius: .5rem;
border-top-right-radius: .5rem; */
position: relative;
}

figcaption {
  position: absolute;
  bottom: 0;
  /* background-color: rgba(0,0,0,.1); */
  /* text-shadow: 2px 2px 8px #383838; */
  text-shadow: 1px 1px 2.5px black;
  width: 100%;
  color: white;
  text-align: left;
}

h3 {
    padding: 0.75rem;
    padding-bottom: 0;
    font-size: 1.25rem;
}

a {
    font-family: 'ZCOOL XiaoWei', serif;
    color: white;
}

p{
    padding: 0.75rem;
    padding-top: 0;
    padding-bottom: 0;
    color: rgb(116, 116, 116);
    font-weight: 400;
    line-height: 1.5rem;
}

span.award{
    display: block;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #333;
}

div.tag{
    display: inline-block;
    /* font-weight: 300; */
    color: #383737cc;
    background-color: rgb(224, 222, 222, 0.5);    /* border: 1px solid #fcdccf; */
    padding: 1px 8px;
    border-radius: 5px;
    font-size: 0.75rem;
    text-transform: uppercase;
    margin-right: 0.45rem;
}
</style>
