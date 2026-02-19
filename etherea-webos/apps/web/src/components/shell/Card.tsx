import { PropsWithChildren } from 'react';

export function Card({ children, title }: PropsWithChildren<{ title?: string }>) {
  return (
    <section className="card">
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  );
}
