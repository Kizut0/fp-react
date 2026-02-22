import { Link } from "react-router-dom";

export default function ClientPageScaffold({ title, description, actions = [] }) {
    return (
        <div className="row">
            <div className="card">
                <div className="h1">{title}</div>
                <div className="muted">{description}</div>
            </div>

            {actions.length > 0 && (
                <div className="card">
                    <div className="h2">Quick Actions</div>
                    <div className="quickActions">
                        {actions.map((action) => (
                            <Link key={action.to} to={action.to} className="btn btnOk">
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
