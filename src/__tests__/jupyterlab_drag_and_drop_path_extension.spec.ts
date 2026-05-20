/**
 * Unit tests for the pure path utilities in `src/paths.ts`.
 */
import {
  dirname,
  formatForPython,
  join,
  normalize,
  pythonString,
  relative,
  resolvePath,
  shellEscape,
  singleDraggedPath
} from '../paths';

describe('normalize', () => {
  it('resolves "." and ".." segments', () => {
    expect(normalize('/a/b/../c')).toEqual('/a/c');
    expect(normalize('a/./b')).toEqual('a/b');
  });

  it('does not let ".." escape an absolute root', () => {
    expect(normalize('/a/../../b')).toEqual('/b');
  });

  it('keeps ".." in a relative path', () => {
    expect(normalize('../a')).toEqual('../a');
  });
});

describe('dirname', () => {
  it('returns the directory portion', () => {
    expect(dirname('a/b/c')).toEqual('a/b');
    expect(dirname('/a/file')).toEqual('/a');
  });

  it('handles top-level paths', () => {
    expect(dirname('file')).toEqual('');
    expect(dirname('/file')).toEqual('/');
  });
});

describe('join', () => {
  it('joins and normalizes', () => {
    expect(join('/root', 'a/b')).toEqual('/root/a/b');
    expect(join('d1/d2', 'f')).toEqual('d1/d2/f');
  });

  it('handles an empty base', () => {
    expect(join('', 'a/b')).toEqual('a/b');
  });
});

describe('relative', () => {
  it('computes relative absolute paths', () => {
    expect(relative('/a/b/c', '/a/b/d/e')).toEqual('../d/e');
  });

  it('returns "." for identical paths', () => {
    expect(relative('/a/b', '/a/b')).toEqual('.');
  });

  it('computes relative paths sharing a root', () => {
    expect(relative('d1/d2', 'd1/f.txt')).toEqual('../f.txt');
    expect(relative('', 'f.txt')).toEqual('f.txt');
  });
});

describe('resolvePath', () => {
  const ctx = { rootDir: '/srv/root', baseDir: '', baseIsAbsolute: true };

  it('builds absolute paths from the server root', () => {
    expect(resolvePath('data/f.csv', 'absolute', ctx)).toEqual(
      '/srv/root/data/f.csv'
    );
  });

  it('builds terminal-relative paths from an absolute base', () => {
    expect(
      resolvePath('data/f.csv', 'relative', {
        rootDir: '/srv/root',
        baseDir: '/srv/root/work',
        baseIsAbsolute: true
      })
    ).toEqual('../data/f.csv');
  });

  it('builds document-relative paths from a contents base', () => {
    expect(
      resolvePath('data/f.csv', 'relative', {
        rootDir: '/srv/root',
        baseDir: 'notebooks',
        baseIsAbsolute: false
      })
    ).toEqual('../data/f.csv');
  });
});

describe('shellEscape', () => {
  it('escapes spaces and shell metacharacters', () => {
    expect(shellEscape('/home/my data/f (1).csv')).toEqual(
      '/home/my\\ data/f\\ \\(1\\).csv'
    );
  });

  it('leaves plain paths unchanged', () => {
    expect(shellEscape('/home/user/file.csv')).toEqual('/home/user/file.csv');
  });
});

describe('pythonString', () => {
  it('wraps a path in single quotes', () => {
    expect(pythonString('/a/b')).toEqual("'/a/b'");
  });

  it('escapes quotes and backslashes', () => {
    expect(pythonString("/a'b")).toEqual("'/a\\'b'");
    expect(pythonString('/a\\b')).toEqual("'/a\\\\b'");
  });
});

describe('formatForPython', () => {
  it('produces a quoted string in posix style', () => {
    expect(formatForPython('/a/b', 'posix', 'pathlib.Path')).toEqual("'/a/b'");
  });

  it('joins pathlib path segments with the / operator', () => {
    expect(formatForPython('/a/b/c', 'pathlib', 'pathlib.Path')).toEqual(
      "pathlib.Path('/a') / 'b' / 'c'"
    );
    expect(formatForPython('a/b', 'pathlib', 'Path')).toEqual(
      "Path('a') / 'b'"
    );
  });

  it('emits a single constructor call when there is only one segment', () => {
    expect(formatForPython('/file', 'pathlib', 'Path')).toEqual(
      "Path('/file')"
    );
    expect(formatForPython('file', 'pathlib', 'Path')).toEqual("Path('file')");
  });
});

describe('singleDraggedPath', () => {
  it('returns the path of a single string item', () => {
    expect(singleDraggedPath(['a/b.csv'])).toEqual('a/b.csv');
  });

  it('returns the path of a single object item', () => {
    expect(singleDraggedPath([{ path: 'a/b.csv' }])).toEqual('a/b.csv');
  });

  it('returns null for multi-item or empty drags', () => {
    expect(singleDraggedPath(['a', 'b'])).toBeNull();
    expect(singleDraggedPath([])).toBeNull();
  });

  it('returns null for non-array data', () => {
    expect(singleDraggedPath(undefined)).toBeNull();
    expect(singleDraggedPath('a/b.csv')).toBeNull();
  });
});
