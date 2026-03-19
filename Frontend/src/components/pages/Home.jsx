import { useNavigate } from "react-router";
import { TypeAnimation } from "react-type-animation";
import img1 from "../../assets/feature.jpeg";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-950 text-white min-h-screen flex flex-col relative overflow-hidden">
            {/* BACKGROUND GLOW */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 opacity-20 blur-3xl rounded-full"></div>

            {/* HERO */} 
            <section className="text-center py-28 px-4 relative z-10">
                <h1 className="text-6xl font-extrabold bg-linear-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-6">
                    CodeCollab
                </h1>

                {/* TYPING ANIMATION */}
                <p className="text-gray-400 text-lg md:text-xl mb-10 h-10">
                    <TypeAnimation
                        sequence={[
                            "Room based coding session",
                            1500,
                            "Real-time code sync",
                            1500,
                            "Multiple language support",
                            1500,
                            "Chat inside coding room",
                            1500,
                            "Invite via share link",
                            1500,
                        ]}
                        speed={50}
                        repeat={Infinity}
                        className="text-blue-400 font-medium tracking-wide drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]"
                    />
                </p>

                <button
                    onClick={() => navigate("/room")}
                    className="px-10 py-4 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
                >
                    Start a Room →
                </button>
            </section>

            {/* SECTION 1 */}
            <section className="grid md:grid-cols-2 items-center px-8 py-20 gap-16">
                <div>
                    <h2 className="text-4xl font-bold mb-6">
                        Built for Developers
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        CodeCollab provides a powerful environment where
                        multiple developers can work together on the same
                        codebase with zero friction.
                    </p>
                </div>

                <img
                    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                    alt="feature"
                    className="w-full h-70 md:h-87.5 object-cover rounded-xl shadow-xl hover:scale-105 transition"
                />
            </section>

            {/* SECTION 2 */}
            <section className="grid md:grid-cols-2 items-center px-8 py-20 gap-16">
                <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
                    alt="feature"
                    className="w-full h-70 md:h-87.5 object-cover rounded-xl shadow-xl hover:scale-105 transition"
                />

                <div>
                    <h2 className="text-4xl font-bold mb-6">Real-time Sync</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Every keystroke is synced instantly. Collaborate live
                        with shared cursors, live updates, and integrated
                        communication.
                    </p>
                </div>
            </section>

            {/* SECTION 3 */}
            <section className="grid md:grid-cols-2 items-center px-8 py-20 gap-16">
                <div>
                    <h2 className="text-4xl font-bold mb-6">
                        Everything in One Place
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        Code editor, chat, execution, and collaboration tools —
                        all combined into one seamless interface.
                    </p>
                </div>

                <img
                    src={img1}
                    alt="feature"
                    className="w-full h-70 md:h-87.5 object-cover rounded-xl shadow-xl hover:scale-105 transition"
                />
            </section>

            {/* CTA */}
            <section className="text-center py-20 relative">
                <h2 className="text-4xl font-bold mb-6">
                    Start collaborating today
                </h2>
                <button
                    onClick={() => navigate("/room")}
                    className="px-10 py-4 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
                >
                    Get Started →
                </button>
            </section>
        </div>
    );
}

export default Home;
