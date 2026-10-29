import { Link } from 'react-router-dom';

function StatusPage({ code, title, description }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-brand-600">{code}</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
        Back to shop
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  return <StatusPage code="404" title="Page not found" description="The page you are looking for does not exist or has been moved." />;
}

export function ForbiddenPage() {
  return <StatusPage code="403" title="Access denied" description="Your account does not have permission to open this page." />;
}
