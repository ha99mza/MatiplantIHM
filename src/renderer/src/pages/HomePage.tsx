import PageShell from '../components/PageShell'

type HomePageProps = {
  onOpenOrders: () => void
  onOpenWorkers: () => void
}

function HomePage({ onOpenOrders, onOpenWorkers }: HomePageProps): React.JSX.Element {
  return (
    <PageShell title="Atelier">
      <section className="home-page" aria-label="Navigation principale">
        <button className="primary-button" type="button" onClick={onOpenOrders}>
          Order
        </button>
        <button className="secondary-button" type="button">
          Operation
        </button>
        <button className="primary-button" type="button" onClick={onOpenWorkers}>
          Worker
        </button>
        <button className="secondary-button" type="button">
          Machine
        </button>
      </section>
    </PageShell>
  )
}

export default HomePage
