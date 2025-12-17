import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function usePM() {
  const [projects, setProjects] = React.useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("pmProjects") || "[]")
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  })
  const [selectedId, setSelectedId] = React.useState(null)
  const [filter, setFilter] = React.useState("All")

  React.useEffect(() => {
    if (!projects.length) {
      const seed = [
        { id: 1, name: "Laser Welding Intro", customer: "Konvy", status: "Planned", startDate: new Date().toISOString().slice(0,10), dueDate: "", tasks: [
          { id: 1, title: "Prepare quotation", assignee: "Sales", dueDate: "", status: "Todo" },
        ] },
      ]
      setProjects(seed)
      try { localStorage.setItem("pmProjects", JSON.stringify(seed)) } catch {}
      setSelectedId(1)
    }
  }, [])

  const saveProjects = (next) => {
    setProjects(next)
    try { localStorage.setItem("pmProjects", JSON.stringify(next)) } catch {}
  }

  const addProject = (p) => {
    const id = Date.now()
    const proj = { id, name: p.name || "Untitled", customer: p.customer || "", status: p.status || "Planned", startDate: p.startDate || new Date().toISOString().slice(0,10), dueDate: p.dueDate || "", tasks: [] }
    saveProjects([proj, ...projects])
    setSelectedId(id)
  }
  const addTask = (pid, t) => {
    const id = Date.now()
    const next = projects.map((p) => p.id === pid ? { ...p, tasks: [{ id, title: t.title || "Task", assignee: t.assignee || "", dueDate: t.dueDate || "", status: t.status || "Todo" }, ...p.tasks] } : p)
    saveProjects(next)
  }
  const setTaskStatus = (pid, tid, status) => {
    const next = projects.map((p) => p.id === pid ? { ...p, tasks: p.tasks.map((tk) => tk.id === tid ? { ...tk, status } : tk) } : p)
    saveProjects(next)
  }
  const updateProject = (pid, patch) => {
    const next = projects.map((p) => p.id === pid ? { ...p, ...patch } : p)
    saveProjects(next)
  }
  const current = projects.find((p) => p.id === selectedId) || null
  const statuses = ["All", "Todo", "Doing", "Done"]
  const filteredTasks = current ? current.tasks.filter((t) => filter === "All" ? true : t.status === filter) : []
  return { projects, current, statuses, filteredTasks, selectedId, setSelectedId, filter, setFilter, addProject, addTask, setTaskStatus, updateProject }
}

function PMPage() {
  const pm = usePM()
  const [showNew, setShowNew] = React.useState(false)
  const [projForm, setProjForm] = React.useState({ name: "", customer: "", dueDate: "" })
  const [taskForm, setTaskForm] = React.useState({ title: "", assignee: "", dueDate: "" })
  const canAddProject = Boolean(projForm.name)
  const canAddTask = pm.current && Boolean(taskForm.title)
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Project Management</h1>
            <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-[#2D4485] hover:text-white" onClick={() => setShowNew(true)}>Add Project</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Projects</div>
                <div className="space-y-2">
                  {pm.projects.map((p) => (
                    <button key={p.id} onClick={() => pm.setSelectedId(p.id)} className={`w-full text-left px-3 py-2 rounded-md border ${pm.selectedId===p.id ? "border-[#2D4485] bg-[#2D4485]/5" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <button
                          className="text-xs px-2 py-0.5 rounded-md border border-gray-300 text-[#2D4485] bg-white hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            const name = window.prompt("Edit project name", p.name)
                            if (!name || !name.trim()) return
                            pm.updateProject(p.id, { name: name.trim() })
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">{p.customer || "-"} • {p.status}</div>
                      <div className="text-xs text-gray-500">Due: {p.dueDate || "-"}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-900">Tasks</div>
                  <div className="flex items-center gap-2">
                    <select value={pm.filter} onChange={(e) => pm.setFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                      {pm.statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200" onClick={() => pm.current && pm.addTask(pm.current.id, taskForm)} disabled={!canAddTask}>Add Task</button>
                  </div>
                </div>
                {pm.current ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" className="rounded-md border border-gray-300 px-3 py-2" />
                      <input value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} placeholder="Assignee" className="rounded-md border border-gray-300 px-3 py-2" />
                      <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="p-2">Task</th>
                            <th className="p-2">Assignee</th>
                            <th className="p-2">Due</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pm.filteredTasks.map((t) => (
                            <tr key={t.id} className="border-t">
                              <td className="p-2">{t.title}</td>
                              <td className="p-2">{t.assignee || "-"}</td>
                              <td className="p-2">{t.dueDate || "-"}</td>
                              <td className="p-2">
                                <select value={t.status} onChange={(e) => pm.setTaskStatus(pm.current.id, t.id, e.target.value)} className="rounded-md border border-gray-300 px-2 py-1">
                                  <option>Todo</option>
                                  <option>Doing</option>
                                  <option>Done</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                          {!pm.filteredTasks.length && (
                            <tr><td className="p-2 text-gray-500" colSpan={4}>No tasks</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">Select a project</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4 text-gray-900">New Project</div>
            <div className="space-y-3">
              <input value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} placeholder="Project name" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input value={projForm.customer} onChange={(e) => setProjForm({ ...projForm, customer: e.target.value })} placeholder="Customer" className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <input type="date" value={projForm.dueDate} onChange={(e) => setProjForm({ ...projForm, dueDate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white">Cancel</button>
                <button disabled={!canAddProject} onClick={() => { pm.addProject(projForm); setShowNew(false); setProjForm({ name: "", customer: "", dueDate: "" }) }} className="px-3 py-1.5 rounded-md bg-[#2D4485] text-white disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <PMPage />
    </LanguageProvider>
  </React.StrictMode>,
)
