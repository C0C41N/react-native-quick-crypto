import { useCallback, useState } from 'react';
import type { Suites } from '../types/suite';
import type { BenchmarkFn, Benchmarks, BenchmarkSuite } from '../types/benchmarks';

export const useBenchmarksList = (): [
  Suites<BenchmarkSuite>,
  (description: string) => void,
  () => void,
  () => void,
] => {
  const [suites, setSuites] =
    useState<Suites<BenchmarkSuite>>(getInitialSuites());

  const toggle = useCallback(
    (description: string) => {
      setSuites(tests => {
        tests[description]!.value = !tests[description]!.value;
        return tests;
      });
    },
    [setSuites],
  );

  const clearAll = useCallback(() => {
    setSuites(prev => {
      Object.values(prev).forEach(suite => {
        suite.value = false;
      });
      return { ...prev };
    });
  }, [setSuites]);

  const checkAll = useCallback(() => {
    setSuites(prev => {
      Object.values(prev).forEach(suite => {
        suite.value = true;
      });
      return { ...prev };
    });
  }, [setSuites]);

  return [suites, toggle, clearAll, checkAll];
};

const getInitialSuites = () => {
  const suiteNames: string[] = [
    // random - all challengers use `crypto` too, so the comparison is to 'us' - maybe skip in future
    'random',
  ];
  const suites: Suites<BenchmarkSuite> = {};
  suiteNames.forEach(suiteName => {
    const benchmarks = loadBenchmarks(suiteName);
    suites[suiteName] = { value: false, benchmarks };
  });

  // return count-enhanced list and totals
  return suites;
};

const loadBenchmarks = (suiteName: string): Benchmarks => {
  const us = allBenchmarks[`${suiteName}/rnqc`];
  const them = allBenchmarks[`${suiteName}/`];
  if (!us || !them) {
    throw new Error(`Could not load benchmarks for ${suiteName}`);
  }
  const ret: Benchmarks = {};
  const themKeys = Object.keys(them);
  // add all 'us' benchmarks
  Object.entries(us).forEach(([name, fn]) => {
    ret[name] = { us: fn, them: them[name] };
    // remove from themKeys
    themKeys.splice(themKeys.indexOf(name), 1);
  });
  // add all 'them' benchmarks that are not in 'us'
  themKeys.forEach(name => {
    ret[name] = { us: us[name], them: them[name] };
  });
  return ret;
};

// can't use dynamic strings here, as require() is compile-time
/* eslint-disable @typescript-eslint/no-require-imports */
const allBenchmarks: Record<string, Record<string, BenchmarkFn>> = {
  // random
  'random/rnqc': require('../benchmarks/random/rnqc').default,
  'random/crypto-browserify': require('../benchmarks/random/crypto-browserify')
    .default,
  // pbkdf2
  'pbkdf2/rnqc': require('../benchmarks/pbkdf2/rnqc').default,
  'pbkdf2/noble': require('../benchmarks/pbkdf2/noble').default,
};
