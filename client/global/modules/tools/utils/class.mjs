export const getStaticProps = (Class) =>
  Object.getOwnPropertyNames(Class).filter(
    (key) => !['length', 'name', 'prototype'].includes(key) && key !== undefined,
  );

export const getStaticMethods = (Class) =>
  Object.getOwnPropertyNames(Class).filter(
    (key) => typeof Class[key] === 'function' && !['length', 'name', 'prototype'].includes(key),
  );
