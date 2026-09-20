"""
Tests for the terminal cwd handler.

Tests the helper methods that detect process cwd without requiring
a running Jupyter server.
"""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock

from jupyterlab_drag_and_drop_path_extension.handlers import (
    TerminalCwdHandler,
    resolve_root_dir,
)


class MockHandler:
    """Mock handler that exposes the cwd detection methods for testing."""

    def __init__(self):
        self.log = MagicMock()

    # Copy methods from TerminalCwdHandler for testing
    _get_cwd_linux = TerminalCwdHandler._get_cwd_linux
    _get_pwd_from_environ = TerminalCwdHandler._get_pwd_from_environ
    _get_cwd_macos = TerminalCwdHandler._get_cwd_macos
    _get_direct_children = TerminalCwdHandler._get_direct_children
    _get_process_comm = TerminalCwdHandler._get_process_comm
    _collect_process_tree = TerminalCwdHandler._collect_process_tree
    _try_get_cwd = TerminalCwdHandler._try_get_cwd
    _is_valid_cwd = TerminalCwdHandler._is_valid_cwd
    _get_process_cwd = TerminalCwdHandler._get_process_cwd


@pytest.fixture
def handler():
    """Create a mock handler instance for testing utility methods."""
    return MockHandler()


class TestGetCwdLinux:
    """Tests for _get_cwd_linux method."""

    def test_returns_cwd_for_current_process(self, handler):
        """Should return cwd for the current process."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        pid = os.getpid()
        cwd = handler._get_cwd_linux(pid)
        assert cwd == os.getcwd()

    def test_returns_none_for_nonexistent_pid(self, handler):
        """Should return None for a non-existent PID."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        # Use a very high PID that's unlikely to exist
        cwd = handler._get_cwd_linux(999999999)
        assert cwd is None

    def test_returns_none_on_permission_error(self, handler):
        """Should return None when permission denied."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        # PID 1 (init) typically has restricted access
        cwd = handler._get_cwd_linux(1)
        # May be None due to permissions, or valid if running as root
        assert cwd is None or isinstance(cwd, str)


class TestGetPwdFromEnviron:
    """Tests for _get_pwd_from_environ method."""

    def test_returns_pwd_for_current_process(self, handler):
        """Should return PWD from current process environment."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        pid = os.getpid()
        pwd = handler._get_pwd_from_environ(pid)
        # PWD should match current directory or be None if not set
        if pwd:
            assert os.path.isabs(pwd)

    def test_returns_none_for_nonexistent_pid(self, handler):
        """Should return None for a non-existent PID."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        pwd = handler._get_pwd_from_environ(999999999)
        assert pwd is None


class TestGetDirectChildren:
    """Tests for _get_direct_children method."""

    def test_returns_list(self, handler):
        """Should always return a list."""
        result = handler._get_direct_children(os.getpid())
        assert isinstance(result, list)

    def test_returns_empty_for_nonexistent_pid(self, handler):
        """Should return empty list for non-existent PID."""
        result = handler._get_direct_children(999999999)
        assert result == []


class TestCollectProcessTree:
    """Tests for _collect_process_tree method (recursive traversal)."""

    def test_collects_current_process(self, handler):
        """Should collect current process info."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        known_shells = {'bash', 'zsh', 'fish', 'sh', 'dash', 'ksh', 'tcsh', 'csh'}
        results = []
        handler._collect_process_tree(os.getpid(), 0, results, known_shells)

        # Should have at least the current process
        assert len(results) >= 1
        # First entry should be current process at depth 0
        pid, depth, is_shell, comm = results[0]
        assert pid == os.getpid()
        assert depth == 0


class TestTryGetCwd:
    """Tests for _try_get_cwd method."""

    def test_returns_cwd_for_current_process(self, handler):
        """Should return cwd for current process."""
        if sys.platform not in ("linux", "darwin"):
            pytest.skip("Linux/macOS only test")

        cwd = handler._try_get_cwd(os.getpid())
        assert cwd is not None
        assert os.path.isabs(cwd)

    def test_returns_none_for_nonexistent_pid(self, handler):
        """Should return None for non-existent PID."""
        cwd = handler._try_get_cwd(999999999)
        assert cwd is None


class TestGetProcessCwd:
    """Tests for _get_process_cwd method."""

    def test_returns_cwd_for_current_process(self, handler):
        """Should return cwd for current process."""
        if sys.platform not in ("linux", "darwin"):
            pytest.skip("Linux/macOS only test")

        cwd = handler._get_process_cwd(os.getpid())
        assert cwd is not None
        assert os.path.isabs(cwd)

    def test_returns_deepest_valid_shell_cwd(self, handler):
        """Should return deepest shell with valid cwd, skipping pseudo-paths."""
        with patch.object(handler, '_try_get_cwd') as mock_try, \
             patch.object(handler, '_collect_process_tree') as mock_collect, \
             patch.object(handler, '_is_valid_cwd') as mock_valid:

            # Tree: fish -> claude -> sh -> chrome
            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, 'fish'))
                results.append((200, 1, False, 'claude'))
                results.append((300, 2, True, 'sh'))
                results.append((400, 3, False, 'chrome'))

            mock_collect.side_effect = populate_tree

            # Chrome has /proc pseudo-path, sh and fish have real paths
            mock_try.side_effect = lambda pid: {
                100: '/home/test/project',
                200: '/home/test/project',
                300: '/home/test/project',
                400: '/proc/123/fdinfo'
            }.get(pid)

            # /proc path is invalid, real paths are valid
            mock_valid.side_effect = lambda p: not p.startswith('/proc/')

            result = handler._get_process_cwd(100)

            # Should skip chrome (/proc), return sh (deepest valid shell)
            assert result == '/home/test/project'

    def test_uses_file_manager_subshell_cwd(self, handler):
        """Should find mc subshell cwd via recursive deepest-first search."""
        with patch.object(handler, '_try_get_cwd') as mock_try, \
             patch.object(handler, '_collect_process_tree') as mock_collect, \
             patch.object(handler, '_is_valid_cwd', return_value=True):

            # Tree: fish -> mc -> bash (subshell with different cwd)
            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, 'fish'))
                results.append((200, 1, False, 'mc'))
                results.append((300, 2, True, 'bash'))

            mock_collect.side_effect = populate_tree

            mock_try.side_effect = lambda pid: {
                100: '/home',
                200: '/home',
                300: '/home/deep'
            }.get(pid)

            result = handler._get_process_cwd(100)

            # Deepest shell (bash at depth 2) has valid cwd
            assert result == '/home/deep'


class TestIsValidCwd:
    """Tests for _is_valid_cwd method."""

    def test_rejects_proc_paths(self, handler):
        """Should reject /proc pseudo-filesystem paths."""
        assert handler._is_valid_cwd('/proc/123/fdinfo') is False
        assert handler._is_valid_cwd('/proc/1/cwd') is False

    def test_rejects_sys_paths(self, handler):
        """Should reject /sys pseudo-filesystem paths."""
        assert handler._is_valid_cwd('/sys/class/net') is False

    def test_rejects_dev_paths(self, handler):
        """Should reject /dev paths."""
        assert handler._is_valid_cwd('/dev/pts/0') is False

    def test_rejects_empty_and_relative(self, handler):
        """Should reject empty or relative paths."""
        assert handler._is_valid_cwd('') is False
        assert handler._is_valid_cwd('relative/path') is False

    def test_accepts_real_directory(self, handler):
        """Should accept existing real directories."""
        assert handler._is_valid_cwd('/tmp') is True
        assert handler._is_valid_cwd(os.getcwd()) is True

    def test_rejects_nonexistent_directory(self, handler):
        """Should reject paths that don't exist."""
        assert handler._is_valid_cwd('/nonexistent/fake/path') is False


class TestGetProcessComm:
    """Tests for _get_process_comm method."""

    def test_get_process_comm_returns_string(self, handler):
        """Should return command name for current process."""
        if sys.platform != "linux":
            pytest.skip("Linux-only test")

        comm = handler._get_process_comm(os.getpid())
        assert comm is not None
        assert isinstance(comm, str)
        assert len(comm) > 0


class TestResolveRootDir:
    """The server root must come back absolute, with no tilde left in it."""

    def test_expands_a_leading_tilde(self):
        # JupyterHub sets root_dir to "~/workspace". realpath alone leaves the
        # tilde as a literal segment, which produced ../../../~/workspace/...
        resolved = resolve_root_dir("~/workspace")
        assert "~" not in resolved
        assert resolved == os.path.realpath(os.path.expanduser("~/workspace"))

    def test_bare_tilde_expands_to_home(self):
        assert resolve_root_dir("~") == os.path.realpath(os.path.expanduser("~"))

    def test_absolute_path_is_preserved(self):
        assert resolve_root_dir("/tmp") == os.path.realpath("/tmp")

    def test_result_is_always_absolute(self):
        for candidate in ("~/workspace", "/tmp", "."):
            assert os.path.isabs(resolve_root_dir(candidate))

    def test_resolves_relative_segments(self):
        assert resolve_root_dir("/tmp/../tmp") == os.path.realpath("/tmp")


class TestShellPrecedence:
    """A child that changed directory must not outrank the user's shell."""

    def test_shell_wins_over_a_deeper_child_that_chdired(self, handler):
        """A non-shell child at depth 1 must not beat the shell at depth 0.

        Regression for DEF-TERM-11: the sort key ordered depth before
        shell-ness, so any backgrounded job started from another directory
        supplied the cwd and every relative drop resolved against it.
        """
        with patch.object(handler, "_try_get_cwd") as mock_try, \
             patch.object(handler, "_collect_process_tree") as mock_collect, \
             patch.object(handler, "_is_valid_cwd", return_value=True):

            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, "bash"))
                results.append((200, 1, False, "sleep"))

            mock_collect.side_effect = populate_tree
            mock_try.side_effect = lambda pid: {
                100: "/home/test/work",
                200: "/tmp/elsewhere",
            }.get(pid)

            assert handler._get_process_cwd(100) == "/home/test/work"

    def test_deepest_shell_still_wins_among_shells(self, handler):
        """Shell-ness is primary, depth is the tie-break among shells."""
        with patch.object(handler, "_try_get_cwd") as mock_try, \
             patch.object(handler, "_collect_process_tree") as mock_collect, \
             patch.object(handler, "_is_valid_cwd", return_value=True):

            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, "fish"))
                results.append((200, 1, False, "mc"))
                results.append((300, 2, True, "bash"))

            mock_collect.side_effect = populate_tree
            mock_try.side_effect = lambda pid: {
                100: "/home/test",
                200: "/home/test",
                300: "/home/test/subshell",
            }.get(pid)

            assert handler._get_process_cwd(100) == "/home/test/subshell"


class TestFallbackValidation:
    """The final fallback must honour the same validity gate as the loop."""

    def test_invalid_fallback_cwd_is_refused(self, handler):
        """Regression for DEF-TERM-9.

        The loop already tried the root pid, so reaching the fallback means
        its cwd was missing or rejected. Returning it unchecked handed back
        exactly the pseudo-filesystem paths the validator exists to filter.
        """
        with patch.object(handler, "_try_get_cwd", return_value="/proc/123/fdinfo"), \
             patch.object(handler, "_collect_process_tree") as mock_collect, \
             patch.object(handler, "_is_valid_cwd", return_value=False):

            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, "bash"))

            mock_collect.side_effect = populate_tree

            assert handler._get_process_cwd(100) is None

    def test_deleted_directory_fallback_is_refused(self, handler):
        """A cwd readlink ending in " (deleted)" is not a usable directory."""
        with patch.object(handler, "_try_get_cwd", return_value="/tmp/gone (deleted)"), \
             patch.object(handler, "_collect_process_tree") as mock_collect:

            def populate_tree(pid, depth, results, known_shells):
                results.append((100, 0, True, "bash"))

            mock_collect.side_effect = populate_tree

            assert handler._get_process_cwd(100) is None
