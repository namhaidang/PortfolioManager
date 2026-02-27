# Jared principles for good specs + plans (short)

- **Clean / concise / elegant**: prefer the simplest design that is correct and maintainable.
- **Priority order**: optimize in this sequence: (1) clean/concise/elegant, (2) complete/correct, (3) performant/watertight.
- **Get the overall shape first**: lock the right high-level decomposition and ordering of the big pieces (resources, performance, modularity, maintainability, watertightness) before fixating on small details.
- **Minimal surface area**: fewer primitives that compose well beats lots of special cases.
- **Not over-specified**: leave room for implementation; focus on key decisions + rationale. Avoid locking exact class/function names unless pivotal; it’s fine to note uncertainty on non-design details (e.g. proposed names) when renaming is straightforward.
- **Match repo conventions**: align to existing service patterns before inventing new structure.
- **Modular where it matters**: encapsulate key seams we expect to evolve (swappable behavior, future expansion) with the smallest useful abstractions; avoid “a billion classes” and abstraction bloat.
- **Understand key intersections**: be thorough where the design touches existing systems; don’t read everything, but do understand how the key pieces work together. Be explicit about what you don’t know and raise questions. Never conjecture about existing system behavior—ask for help instead.

