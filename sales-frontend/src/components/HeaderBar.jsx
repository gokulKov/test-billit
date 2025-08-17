function HeaderBar({ title, subtitle }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
    </header>
  );
}
