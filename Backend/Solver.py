import pulp

def _share_compatible_set(task_a, task_b, compatible_sets):
  for group in compatible_sets:
    if task_a in group and task_b in group:
      return True
  return False

def _incompatible_pairs_from_sets(tasks, compatible_sets):
  """Task pairs with no common compatible set cannot share a station."""
  return [
    (task_a, task_b)
    for i, task_a in enumerate(tasks)
    for task_b in tasks[i + 1:]
    if not _share_compatible_set(task_a, task_b, compatible_sets)
  ]

def solve_assembly_line_balancing(
  task_times, precedence, cycle_time, compatible_sets=None
):

  # 1. Initialize the Optimization Problem (Minimization)
  model = pulp.LpProblem("Assembly_Line_Balancing", pulp.LpMinimize)

  n = len(task_times)
  max_stations = len(task_times)
  tasks = [i for i in range(1, n + 1)]
  workstations = [i for i in range(1, max_stations + 1)]

  # 2. Define Decision Variables
  # X_ns = 1 if task n is assigned to station s
  X = pulp.LpVariable.dicts(
    "X",
    ((task, station) for task in tasks for station in workstations),
    cat=pulp.LpBinary,
  )
  # Y_s = integer number of machines on station s
  Y = pulp.LpVariable.dicts("Y", workstations, cat=pulp.LpInteger)

  Z = pulp.LpVariable.dicts("Z", workstations, cat=pulp.LpBinary)

  # 3. Objective: minimize the number of stations used (SALBP-1)
  model += pulp.lpSum(Y[s] for s in workstations), "Minimize_Stations"

  # 4. Add Constraints

  # Every task must be assigned to exactly one workstation
  for task in tasks:
    model += pulp.lpSum(X[task, s] for s in workstations) == 1, f"Assign_Task_{task}"

  # Station capacity cannot exceed the cycle time limit
  for s in workstations:
    model += (
      pulp.lpSum(task_times[task] * X[task, s] for task in tasks) <= cycle_time * Y[s],
      f"Capacity_Station_{s}",
    )

  # A task can only be placed on an open station
  for task in tasks:
    for s in workstations:
      model += X[task, s] <= Y[s], f"Open_Station_{task}_{s}"

  # Use lower-numbered stations first (avoids gaps like using 1 and 3 but not 2)
  for s in range(1, max_stations):
    model += Z[s] >= Z[s + 1], f"Station_Order_{s}"
    model += Y[s] <= 1000 * Z[s], f"At_Least_One_Machine_When_Open_{s}"

  # Precedence: if task n must precede task m, station(n) <= station(m)
  for (task_n, task_m) in precedence:
    station_n = pulp.lpSum(s * X[task_n, s] for s in workstations)
    station_m = pulp.lpSum(s * X[task_m, s] for s in workstations)
    model += station_n <= station_m, f"Precedence_{task_n}_before_{task_m}"

  # Compatible sets: tasks on the same station must share at least one set
  if compatible_sets is None:
    compatible_sets = [[]]
  normalized_sets = [set(group) for group in compatible_sets]
  for task_a, task_b in _incompatible_pairs_from_sets(tasks, normalized_sets):
    for s in workstations:
      model += (
        X[task_a, s] + X[task_b, s] <= 1,
        f"Incompatible_{task_a}_{task_b}_Station_{s}",
      )

  status = model.solve(pulp.PULP_CBC_CMD(msg=False))
  return status, X, Y


def format_solution(status, X, Y, task_times, cycle_time):
  status_label = pulp.LpStatus[status]
  max_stations = len(task_times)
  result = {
    "status": status_label,
    "cycle_time": cycle_time,
    "max_cycle_time": 0,
    "stations_used": 0,
    "stations": [],
  }

  if status_label != "Optimal":
    return result

  stations_used = sum(pulp.value(Y[s]) for s in range(1, max_stations + 1))
  result["stations_used"] = int(stations_used)

  max_load = 0
  for s in range(1, max_stations + 1):
    mach_qty = pulp.value(Y[s])
    if mach_qty is None or mach_qty < 1:
      continue
    assigned_tasks = [
      task for task in task_times if pulp.value(X[task, s]) == 1
    ]
    load = sum(task_times[task] for task in assigned_tasks)
    load_per_machine = load / mach_qty

    if load_per_machine > max_load:
      max_load = load_per_machine
    
    result["stations"].append({
      "station_id": s,
      "tasks": assigned_tasks,
      "load": round(load_per_machine, 3),
      "machine_qty": int(mach_qty),
    })
    
  result["max_cycle_time"] = round(max_load, 3)

  return result


def main():
  cycle_time = 1.5
  task_times = {
    1: 0.595, 2: 1.107, 3: 0.780, 4: 0.353, 5: 0.717,
    6: 0.589, 7: 1.893, 8: 1.278, 9: 1.273,
  }
  precedence = [
    (1, 2), (2, 3), (3, 4), (4, 5),
    (5, 6), (6, 7), (7, 8), (8, 9),
  ]
  compatible_sets = [
    
  ]

  status, X, Y = solve_assembly_line_balancing(
   task_times, precedence, cycle_time, compatible_sets
  )
  result = format_solution(status, X, Y, task_times, cycle_time)
  print(f"Optimization Status: {result['status']}")
  if result["status"] == "Optimal":
    print(f"Cycle time limit: {cycle_time} minutes")
    print(f"Minimum stations used: {result['stations_used']}\n")
    for station in result["stations"]:
      print(
        f"Workstation {station['station_id']} runs Tasks: {station['tasks']} "
        f"(load: {station['load']}) (mach_qty: {station['machine_qty']})"
      )


if __name__ == "__main__":
  main()
