import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobService } from "../../services/jobService";

export default function JobListPublic() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobService.getAll();
                setJobs(data);
            } catch (err) {
                setError("Failed to load jobs.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) return <p className="p-6">Loading jobs...</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>

            <div className="space-y-4">
                {jobs.map((job) => (
                    <div
                        key={job._id}
                        className="border p-4 rounded shadow-sm hover:shadow"
                    >
                        <h2 className="text-lg font-semibold">{job.title}</h2>
                        <p className="text-gray-600 mb-2">
                            {job.description.substring(0, 100)}...
                        </p>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-600">
                                ${job.budget}
                            </span>

                            <Link
                                to={`/jobs/${job._id}`}
                                className="text-blue-600 hover:underline"
                            >
                                View Details →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}