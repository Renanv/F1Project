module.exports = function override(config, env) {
  // Find the existing rule for handling files
  const fileLoaderRule = config.module.rules.find(rule =>
    rule.oneOf && rule.oneOf.some(r => r.loader && r.loader.includes('file-loader'))
  );

  // Exclude .ftl files from the existing file loader
  if (fileLoaderRule) {
    fileLoaderRule.oneOf.forEach(r => {
      if (r.loader && r.loader.includes('file-loader')) {
        r.exclude = (r.exclude || []).concat(/\.ftl$/);
      }
    });
  }

  // Add raw-loader for .ftl files
  config.module.rules.push({
    test: /\.ftl$/,
    type: 'asset/source'
});

  return config;
};
