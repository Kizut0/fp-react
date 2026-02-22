import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jobService } from "../../services/jobService";

export default function JobDetailPublic() {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await jobService.getById(id);
                setJob(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    if (loading) return <p className="p-6">Loading job...</p>;
    if (!job) return <p className="p-6">Job not found.</p>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{job.title}</h1>

            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="bg-gray-100 p-4 rounded">
                <p>
                    <strong>Budget:</strong> ${job.budget}
                </p>
                <p>
                    <strong>Category:</strong> {job.category}
                </p>
            </div>
        </div>
    );
}