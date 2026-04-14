import { motion } from "framer-motion";

function App() {
	return (
		<>
			<div className="crt-overlay" />
			<div className="vignette" />

			<main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="border-4 border-arena-border bg-arena-panel p-10 max-w-2xl w-full rounded-sm text-center shadow-2xl relative overflow-hidden"
				>
					{/* Animated Background Glitch Element */}
					<motion.div
						animate={{ x: [-100, 500] }}
						transition={{
							repeat: Infinity,
							duration: 3,
							ease: "linear",
							repeatDelay: 2,
						}}
						className="absolute top-0 bottom-0 left-0 w-8 bg-white/5 skew-x-12 filter blur-sm"
					/>

					<h1 className="text-7xl text-arena-red mb-6 drop-shadow-[0_0_15px_rgba(255,60,60,0.5)]">
						⚔️ AGORA
					</h1>

					<p className="text-2xl text-arena-text/80 mb-10 tracking-wider">
						SYSTEM INITIALIZED. AWAITING CONNECTION...
					</p>

					<div className="flex justify-center gap-6">
						<motion.div
							animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
							transition={{ repeat: Infinity, duration: 1.5 }}
							className="w-4 h-4 bg-arena-blue rounded-full shadow-[0_0_15px_#3c82ff]"
						/>
						<motion.div
							animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
							transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
							className="w-4 h-4 bg-arena-red rounded-full shadow-[0_0_15px_#ff3c3c]"
						/>
					</div>
				</motion.div>
			</main>
		</>
	);
}

export default App;
