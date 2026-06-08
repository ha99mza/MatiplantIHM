import HomeCard from '../components/HomeCard'
import PageShell from '../components/PageShell'

type HomePageProps = {
  onOpenOrders: () => void
  onOpenWorkers: () => void
}

function HomePage({ onOpenOrders, onOpenWorkers }: HomePageProps): React.JSX.Element {
  return (
    <PageShell title="Atelier">
      <section className="home-page" aria-label="Navigation principale">
        <HomeCard title="Order" variant="orders" onClick={onOpenOrders} />
        <HomeCard title="Operation" variant="operations" />
        <HomeCard title="Worker" variant="workers" onClick={onOpenWorkers} />
        <HomeCard title="Machine" variant="machines" />
      </section>
    </PageShell>
  )
}

export default HomePage
