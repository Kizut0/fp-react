import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="row max-w-3xl mx-auto p-6">
            <div className="card text-center">
                <div className="h1">Page Not Found</div>
                <p className="muted">
                    The page you requested does not exist or may have moved.
                </p>
                <div className="quickActions centeredActions">
                    <Link to="/" className="btn btnOk">Go to Home</Link>
                    <Link to="/jobs" className="btn">Browse Jobs</Link>
                </div>
            </div>
        </div>
    );
}
