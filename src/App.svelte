<script lang="ts">
	import svelteLogo from "./assets/svelte.svg";
	import viteLogo from "/vite.svg";
	import Counter from "./lib/Counter.svelte";
	import electronLogo from "./assets/electron.svg";
	import tailwindLogo from "./assets/tailwind.svg";
	import BotInfo from "./components/BotInfo.svelte";

	// const nodeVersion = api.node();
	// const chromeVersion = api.chrome();
	// const electronVersion = api.electron();
</script>

<main class="min-h-screen bg-slate-900 text-white flex flex-col">
	<!-- Top Part -->
	<section class="flex justify-center items-center m-2">
		<BotInfo />
	</section>

	<!-- Middle Part -->
	<section class="flex flex-col items-center justify-center mt-6">BODY</section>

	<!-- Footer -->
	<footer class="bg-gray-950 fixed bottom-0 left-0 w-full py-2">
		<div class="flex justify-between items-center mx-6">
			<p class="flex-auto text-xs font-light">
				Made with 🧡 by Seblor
			</p>

			<a
				target="_blank"
				rel="noreferrer"
				href="https://ko-fi.com/Seblor"
				class="text-xs flex items-center py-1 px-4 bg-gray-800 hover:bg-indigo-700 text-white
				transition ease-in duration-200 text-center shadow-md focus:outline-none rounded-md"
			>
				Buy me a coffee <span class="ml-3 text-2xl">☕️</span>
			</a>
		</div>
	</footer>
</main>
