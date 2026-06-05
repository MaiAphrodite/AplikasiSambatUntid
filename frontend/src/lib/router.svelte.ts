let _component = $state.raw<any>(null);
let _params = $state<Record<string, string>>({});
let _path = $state("/");

export const routeState = {
  get component() { return _component; },
  set component(v) { _component = v; },
  get params() { return _params; },
  set params(v) { _params = v; },
  get path() { return _path; },
  set path(v) { _path = v; }
};

export function navigate(path: string) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`
}

export function initRouter(routes: Record<string, any>) {
  const updateRoute = () => {
    const hash = window.location.hash || "#/"
    const path = hash.replace(/^#/, "") || "/"
    const pathParts = path.split("?")[0].split("/")

    let matched = false

    for (const [routePattern, component] of Object.entries(routes)) {
      const patternParts = routePattern.split("/")

      if (patternParts.length !== pathParts.length) continue

      const params: Record<string, string> = {}
      let match = true

      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
          const paramName = patternParts[i].slice(1)
          params[paramName] = pathParts[i]
        } else if (patternParts[i] !== pathParts[i]) {
          match = false
          break
        }
      }

      if (match) {
        routeState.component = component
        routeState.params = params
        routeState.path = path
        matched = true
        break
      }
    }

    if (!matched) {
      routeState.component = routes["/"]
      routeState.params = {}
      routeState.path = "/"
    }
  }

  window.addEventListener("hashchange", updateRoute)
  updateRoute()

  return () => window.removeEventListener("hashchange", updateRoute)
}
