import base from './playwright.config.mjs';
export default {
  ...base, testDir:'./tests/dev-tools', testMatch:'**/*.spec.mjs', globalSetup:'./tests/dev-tools/setup.mjs',
  outputDir:'.emdash/checks/dev-hud/results',
  reporter:[['list'],['json',{outputFile:'.emdash/checks/dev-hud/results.json'}]],
  projects:base.projects.map(project=>({...project,use:{...base.use,...project.use,reducedMotion:'reduce'}})),
};
