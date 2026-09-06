'use client';
import { useLayoutEffect, useRef, type ComponentProps } from 'react';

export function GrowingTextarea(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const resize = () => { field.style.height = 'auto'; field.style.height = `${Math.min(field.scrollHeight, 140)}px`; field.style.overflowY = field.scrollHeight > 140 ? 'auto' : 'hidden'; };
    resize();
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) { width = field.clientWidth; resize(); }
    });
    let width = field.clientWidth;
    observer.observe(field);
    return () => observer.disconnect();
  }, [props.value]);
  return <textarea {...props} ref={ref} />;
}
