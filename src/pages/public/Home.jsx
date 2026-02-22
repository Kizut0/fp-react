import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-4xl font-bold mb-4">
                Find Top Freelancers for Your Projects
            </h1>

            <p className="text-gray-600 mb-6 max-w-xl">
                Post jobs, receive proposals, hire experts, and manage contracts —
                all in one platform.
            </p>

            <div className="flex gap-4">
                <Link
                    to="/jobs"
                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                >
                    Browse Jobs
                </Link>

                <Link
                    to="/login"
                    className="border border-blue-600 text-blue-600 px-6 py-3 rounded hover:bg-blue-50"
                >
                    Get Started
                </Link>
            </div>
        </div>
    );
}
