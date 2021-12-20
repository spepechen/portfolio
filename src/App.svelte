<script>
	import List from './List.svelte'
	import Grid from './Grid.svelte'
	//import groups from './groupedByOrg.json'
	import Hero from './Hero.svelte'
	import Footer from './Footer.svelte'
	import rawData from "./portfolio.csv"   

	// const data = {
	// 	'foo': [1,2,3],
	// 	'bar': [4,5,6,7,8,9,10,11],
	// 	'baz': [12,24,42]
	// }
	//console.log(groups);

	

	console.log(rawData);

	let groupBy = function(xs, key) {
	return xs.reduce(function(rv, x) {
	(rv[x[key]] = rv[x[key]] || []).push(x);
	return rv;
	}, {});
	};

	let groups = groupBy(rawData, 'org')
	console.log(Object.keys(groups))
	let orgFullList = Object.keys(groups)

</script>



<main>
	<Hero/>
	<h2>Work Projects I <img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/samsung/312/black-heart_1f5a4.png" class="enlarge animate" />
	</h2>
		<Grid 
			data={rawData}
			orgList = {orgFullList.filter(d => d !== "MVTEC")}
		/>
	<section>
		<h2>School Works I <img src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/openmoji/292/black-star_2605.png" class="vert-move animate" />
		</h2>	
		<Grid 
			data={rawData}
			orgList = {orgFullList.filter(d => d === "MVTEC")}
		/>
	</section>
	<section>
		<h2>All projects created at...</h2>
		{#each Object.entries(groups) as group}
			<List {group} />
		{/each}
	</section>
	<Footer/>
</main>

<style>
	main {
		max-width: 1200px !important;
		text-align: left;
		padding: 1em;
		margin: auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	section{
	padding-top: 2rem;
	padding-bottom: 2rem;
	}
	
	img.vert-move {
	padding-left: 2px;
	max-height: 30px;
	-webkit-animation: mover 1s infinite  alternate;
	animation: mover 1s infinite  alternate;
	}
	@-webkit-keyframes mover {
	0% { transform: translateY(3px); }
	100% { transform: translateY(8px); }
	}

	img.enlarge {
	margin-bottom: -5px;
	margin-left: 2px;
	max-height: 25px;
	-webkit-animation: enlarge 1s infinite  alternate;
	animation: enlarge 1s infinite  alternate;
	}
	@-webkit-keyframes enlarge {
	0% { transform: scale(0.85, 0.85); }
	100% { transform: scale(1,1); }
	}



</style>