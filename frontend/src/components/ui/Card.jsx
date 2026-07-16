export function Card({ title, eyebrow, children, action }) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="card__body">{children}</div>
    </section>
  )
}
