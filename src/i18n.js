import { FluentBundle, FluentResource } from '@fluent/bundle';
import en from './locales/en.ftl';
import pt from './locales/pt.ftl';

const createBundle = (locale, resources) => {
  const bundle = new FluentBundle(locale);
  const resource = new FluentResource(resources);
  bundle.addResource(resource);
  return bundle;
};

const bundles = [
  createBundle('en', en),
  createBundle('pt', pt),
];

export { bundles };