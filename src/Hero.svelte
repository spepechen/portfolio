<script>

</script>

<section class="project">
    <h1>                
        Spe Chen
        <span class='note'>pronounced as the first syllable in <em>"special"</em></span>
    </h1>
    <div>  
        <p>              
        I design, code, and crunch data for storytelling at The Straits Times <span class='emoji'>🇸🇬</span>. Past stint in newsrooms in <span class='emoji'>🇹🇼 🇺🇸 🇨🇳</span>
        </p>
        <div class="contact"> 
            <a href="">spepe.chen_at_gmail.com</a>
        </div>
        <div class="contact"> 
            <a href="https://twitter.com/spepechen"> @spepechen </a>
        </div>


    </div>
</section>


<style>

h1{
    font-size: 4rem;
}

p {
    font-size: 1.5rem;
    font-weight: 300;
}

span{
    display: block;
    height: 1.5rem;
}

section {
    padding: 2rem 0rem;
    /* grid styles */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    align-items: center;
}

@media only screen and (min-width: 600px) {
        section{
            grid-template-columns: 35% 50%;
    }
}

span.note{
    color:gray;
    font-size: 0.25em;
    font-weight: 100;
    font-style: thin;
    padding-top: 2rem;
}

a{
    border-bottom: 3px rgb(102,205,170, 0.6)  solid;
    /* NOT WORKING IN SAFARI */
    /* border-bottom: 3px solid;
    border-image: linear-gradient(to left, rgb(255,249,248) 1%, rgb(255,152,114)100%);
    border-image-slice: 1;
    -webkit-border-image:linear-gradient(to left, rgb(255,249,248) 1%, rgb(255,152,114)100%); */
}

.contact{
    /* text-transform: uppercase;
    font-weight: 300; */
    font-family: 'Lato', sans-serif;
    font-size: 1rem;
    padding: 0.25rem;
}

.contact > a{
    color: rgb(51, 51, 51, 0.4);

}

.emoji{
    display: inline;
    color: gray; 
    filter: grayscale(85%);
    opacity: 0.7;
}
</style>
