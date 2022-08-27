import test from 'ava';
import { isContainerImageBuilt } from '../src/utils/functions.mjs';
import { parseRequests } from './request-parser.mjs';
import { filesFromRequests, tmpRootPath } from './globals.mjs';
import { promises as fs } from 'fs';
import path from 'path';

// For creating the bare minimum to emulate the executor environment
// Requires request.fileName to be set
export async function createEnvironment(request, tmpPath, repoPath) {
  const mountPath = path.join(tmpPath, 'mount');
  const measurerPath = path.join(repoPath, 'tools', 'measurer');

  // Create the tmp and mount directory
  await fs.mkdir(tmpPath);
  await fs.mkdir(mountPath);

  // Copy over the files to build the measurer and write source code
  await Promise.all([
    fs.writeFile(path.join(mountPath, request.fileName), request.sourceCode),
    fs.copyFile(
      path.join(measurerPath, 'demoter.c'),
      path.join(mountPath, 'demoter.c')
    ),
    fs.copyFile(
      path.join(measurerPath, 'Makefile'),
      path.join(mountPath, 'Makefile')
    ),
  ]);

  return mountPath;
}

// Macro to be run before tests to prepare for running container
export const prepareEnvironmentMacro = test.macro(
  async (t, requiredTypes, requiredLanguages, action) => {
    // Make sure image is built
    if (!(await isContainerImageBuilt('executioner'))) {
      throw  'Container image is not built, please run `npm install`'
    }

    // Parse requests
    t.context.requests = await parseRequests(
      undefined,
      requiredTypes,
      requiredLanguages
    ).catch((e) => {
      t.fail(e.message);
    });

    // Generate the tmp environment names for the request
    t.context.tmpPaths = requiredLanguages.reduce((langAcc, lang) => {
      langAcc[lang] = requiredTypes.reduce((typeAcc, type) => {
        typeAcc[type] = path.join(
          tmpRootPath,
          `request_testing_container_${action}_with_${filesFromRequests[type]}_for_${lang}`
        );
        return typeAcc;
      }, {});
      return langAcc;
    }, {});

    // Iterate through tmpPaths and delete tmp directories if they exist
    for (const languageRequests of Object.values(t.context.tmpPaths)) {
      for (const tmpPath of Object.values(languageRequests)) {
        await fs.rm(tmpPath, { recursive: true, force: true });
      }
    }
  }
);

// Macro to be run after container to clear tmp directories
export const cleanEnvironmentMacro = test.macro(async (t) => {
  // Iterate through tmpPaths and delete tmp directory
  if (!t.context.tmpPaths) {
    return
  }
  
  for (const languageRequests of Object.values(t.context.tmpPaths)) {
    for (const tmpPath of Object.values(languageRequests)) {
      await fs.rm(tmpPath, { recursive: true, force: true });
    }
  }
});