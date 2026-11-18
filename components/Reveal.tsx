// Reveal-on-scroll wrapper. A plain server component: it only marks the element;
// components/Motion (in the layout) does the work. Visible by default.
import type { CSSProperties, ElementType, ReactNode } from 'react';

type Props = { as?: ElementType; className?: string; delay?: number; id?: string; style?: CSSProperties; children: ReactNode } & Record<string, unknown>;

export default function Reveal({ as: Tag = 'div', className, delay, style, children, ...rest }: Props) {
  const s = delay ? { ...style, transitionDelay: `${delay}ms` } : style;
  return <Tag data-reveal="" className={className} style={s} {...rest}>{children}</Tag>;
}
