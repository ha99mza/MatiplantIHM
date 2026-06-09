import PageShell from '../components/PageShell'

type SectionPlaceholderPageProps = {
  title: string
}

function SectionPlaceholderPage({ title }: SectionPlaceholderPageProps): React.JSX.Element {
  return (
    <PageShell title={title}>
      <section className="placeholder-panel">
        <h2>{title}</h2>
        <p>Cette section sera connectee quand son API sera disponible.</p>
      </section>
    </PageShell>
  )
}

export default SectionPlaceholderPage
