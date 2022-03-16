<script>

	let nasjonalitet = [];
	let navn;
	let input;

	const getnasjonalitet = async () => { 
		const url = 'https://api.nationalize.io?name='+input
		const data = await fetch(url);
		const json = await data.json();
		nasjonalitet = json.country
		navn= input; 
	}
	getnasjonalitet()

	let joke 
	const getJoke = async () => {
		const data = await fetch("https://api.chucknorris.io/jokes/random")
		const json = await data.json()
		joke = json.value
	}
	getJoke()

let dog 
const getDog = async () => {
	const data = await fetch("https://dog.ceo/api/breeds/image/random")
	const json = await data.json()
	dog = json.message 
}

	</script>

	<main>

<h2>Hannas informasjonskaplser! </h2>
<br>
<br>
<br>
<br>

<div class="nasj">
	<h1>Hvilken nasjonalitet er du??????????</h1>
		<p>Hvilken nasjonalitet er du basert på navnet ditt?????</p>
		<input bind:value={input}>
		<button on:click={getnasjonalitet}> Kalkuler</button>
		

		{#each nasjonalitet as land}

		<p>Vi kan si at {navn} kommer fra: {land.country_id} med en sikkerhet på {land.probability*100}%</p>
		
			
		{/each}
	</div>
<br>
<br>
<br>
<br>
<h1>Vil du ha en joke????????</h1>

	<div class="rasj">
		
			<p>{joke}</p>
			<button on:click={getJoke}>ny vits!!!!</button>

	</div>
	<br>
	<br>
	<br>
	<p>{localStorage.BAR}</p>
	<br>
<div class= dog>
	<h1>Se på disse kule dogene!!!!!!!</h1>
	<img class= "hund" src="{dog}" alt="">
	<br>
	<br>
	<br>

	<button on:click={getDog}>ny hund!!!!!</button>
</div>


<h1>Håper du likte siden min!!!!!!!!!!!!!!!!!!!!</h1>
<br>
<br>
<br>
<br>

	</main>

	<style>
		main {
		text-align: center;
		background-color: hotpink;
		}
		h2 {
			font-size: 50px;
		}
		.hund {
			max-height: 200px;
			max-width: 300px;
		}
	</style>