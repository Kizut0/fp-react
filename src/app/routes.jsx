import React from "react";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleGate from "../components/RoleGate";

import Home from "../pages/public/Home";
import JobListPublic from "../pages/public/JobListPublic";
import JobDetailPublic from "../pages/public/JobDetailPublic";
import FreelancerProfilePublic from "../pages/public/FreelancerProfilePublic";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import ClientDashboard from "../pages/client/ClientDashboard";
import ClientJobs from "../pages/client/ClientJobs";
import ClientJobEditor from "../pages/client/ClientJobEditor";
import ClientJobDetail from "../pages/client/ClientJobDetail";
import ClientProposals from "../pages/client/ClientProposals";
import ClientContracts from "../pages/client/ClientContracts";
import ClientPayments from "../pages/client/ClientPayments";
import ClientReviews from "../pages/client/ClientReviews";

import FreelancerDashboard from "../pages/freelancer/FreelancerDashboard";
import BrowseJobs from "../pages/freelancer/BrowseJobs";
import MyProposals from "../pages/freelancer/MyProposals";
import FreelancerContracts from "../pages/freelancer/FreelancerContracts";
import FreelancerPayments from "../pages/freelancer/FreelancerPayments";
import FreelancerReviews from "../pages/freelancer/FreelancerReviews";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminJobs from "../pages/admin/AdminJobs";
import AdminProposals from "../pages/admin/AdminProposals";
import AdminContracts from "../pages/admin/AdminContracts";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminPayments from "../pages/admin/AdminPayments";

import NotFound from "../pages/NotFound";

export const routes = [
    {
        element: <AppShell />,
        children: [
            { path: "/", element: <Home /> },
            { path: "/jobs", element: <JobListPublic /> },
            { path: "/jobs/:jobId", element: <JobDetailPublic /> },
            { path: "/freelancers/:freelancerId", element: <FreelancerProfilePublic /> },

            { path: "/login", element: <Login /> },
            { path: "/register", element: <Register /> },

            // Client
            {
                path: "/client",
                element: (
                    <ProtectedRoute>
                        <RoleGate allow={["Client"]} />
                    </ProtectedRoute>
                ),
                children: [
                    { path: "dashboard", element: <ClientDashboard /> },
                    { path: "jobs", element: <ClientJobs /> },
                    { path: "jobs/new", element: <ClientJobEditor mode="create" /> },
                    { path: "jobs/:jobId/edit", element: <ClientJobEditor mode="edit" /> },
                    { path: "jobs/:jobId", element: <ClientJobDetail /> },
                    { path: "proposals", element: <ClientProposals /> },
                    { path: "contracts", element: <ClientContracts /> },
                    { path: "payments", element: <ClientPayments /> },
                    { path: "reviews", element: <ClientReviews /> },
                ],
            },

            // Freelancer
            {
                path: "/freelancer",
                element: (
                    <ProtectedRoute>
                        <RoleGate allow={["Freelancer"]} />
                    </ProtectedRoute>
                ),
                children: [
                    { path: "dashboard", element: <FreelancerDashboard /> },
                    { path: "browse", element: <BrowseJobs /> },
                    { path: "proposals", element: <MyProposals /> },
                    { path: "contracts", element: <FreelancerContracts /> },
                    { path: "payments", element: <FreelancerPayments /> },
                    { path: "reviews", element: <FreelancerReviews /> },
                ],
            },

            // Admin
            {
                path: "/admin",
                element: (
                    <ProtectedRoute>
                        <RoleGate allow={["Admin"]} />
                    </ProtectedRoute>
                ),
                children: [
                    { path: "dashboard", element: <AdminDashboard /> },
                    { path: "users", element: <AdminUsers /> },
                    { path: "jobs", element: <AdminJobs /> },
                    { path: "proposals", element: <AdminProposals /> },
                    { path: "contracts", element: <AdminContracts /> },
                    { path: "reviews", element: <AdminReviews /> },
                    { path: "payments", element: <AdminPayments /> },
                ],
            },

            { path: "*", element: <NotFound /> },
        ],
    },
];