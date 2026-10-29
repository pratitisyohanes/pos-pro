import { useSessionBootstrap } from './hooks/useSessionBootstrap';
import { PageLoader } from './components/ui/Spinner';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const isReady = useSessionBootstrap();

  if (!isReady) return <PageLoader label="Preparing your session..." />;

  return <AppRoutes />;
}
