from node import Node
from utils import validate_data, build_order_objects, build_station_objects


def build_graph(root: Node, order_objects: list, station_objects: list, max_weight: int):
    
    def manhattan(p1, p2):
        return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])
    
    def fuel_cost(p1, p2):
        return manhattan(p1, p2) / 20.0
    
    def can_go_direct(from_pos, to_pos, fuel):
        return fuel > fuel_cost(from_pos, to_pos)
    
    def find_nearest_station(from_pos, fuel, stations):
        best = None
        best_cost = float('inf')
        for station in stations:
            cost = fuel_cost(from_pos, station["position"])
            if fuel >= cost and cost < best_cost:
                best_cost = cost
                best = station
        return best, best_cost
    
    num_orders = len(order_objects) // 2
    root.metadata["orders_status"] = {i: "pending" for i in range(num_orders)}
    
    max_fuel = root.get_metadata("f")
    start_pos = root.position
    best = {"path": [], "fuel": float('inf')}
    stack = [(root, [root], 0)]
    visited = set()
    
    iter_count = 0
    max_iter = 1000000
    
    while stack and iter_count < max_iter:
        iter_count += 1
        
        node, path, fuel_used = stack.pop()
        pos = node.position
        fuel = node.get_metadata("f")
        weight = node.get_metadata("w")
        status = node.get_metadata("orders_status")
        
        state_sig = (tuple(pos), tuple(sorted(status.items())))
        if state_sig in visited:
            continue
        visited.add(state_sig)
        
        if fuel_used >= best["fuel"]:
            continue
        
        all_delivered = all(s == "delivered" for s in status.values())
        
        if all_delivered:
            if pos == start_pos:
                if fuel_used < best["fuel"]:
                    best["path"] = path[:]
                    best["fuel"] = fuel_used
                continue
            else:
                if can_go_direct(pos, start_pos, fuel):
                    cost = fuel_cost(pos, start_pos)
                    finish = Node(start_pos, {
                        "type": "finish",
                        "f": fuel - cost,
                        "w": weight,
                        "orders_status": status.copy()
                    })
                    new_fuel = fuel_used + cost
                    if new_fuel < best["fuel"]:
                        best["path"] = path + [finish]
                        best["fuel"] = new_fuel
                continue
        
        for i in range(0, len(order_objects), 2):
            oid = i // 2
            
            if status[oid] == "pending":
                pickup_obj = order_objects[i]
                pickup_pos = pickup_obj["position"]
                order_weight = pickup_obj["w"]
                
                if weight + order_weight > max_weight:
                    continue
                
                if can_go_direct(pos, pickup_pos, fuel):
                    cost = fuel_cost(pos, pickup_pos)
                    new_status = status.copy()
                    new_status[oid] = "picked"
                    
                    pickup_node = Node(pickup_pos, {
                        "type": pickup_obj["type"],
                        "f": fuel - cost,
                        "w": weight + order_weight,
                        "orders_status": new_status
                    })
                    stack.append((pickup_node, path + [pickup_node], fuel_used + cost))
                else:
                    station, s_cost = find_nearest_station(pos, fuel, station_objects)
                    if station:
                        s_pos = station["position"]
                        if can_go_direct(s_pos, pickup_pos, max_fuel):
                            cost_to_pickup = fuel_cost(s_pos, pickup_pos)
                            total_cost = s_cost + cost_to_pickup
                            
                            new_status = status.copy()
                            new_status[oid] = "picked"
                            
                            station_node = Node(s_pos, {
                                "type": station["type"],
                                "f": max_fuel,
                                "w": weight,
                                "orders_status": status.copy()
                            })
                            
                            pickup_node = Node(pickup_pos, {
                                "type": pickup_obj["type"],
                                "f": max_fuel - cost_to_pickup,
                                "w": weight + order_weight,
                                "orders_status": new_status
                            })
                            
                            stack.append((pickup_node, path + [station_node, pickup_node], fuel_used + total_cost))
            
            if status[oid] == "picked":
                deliver_obj = order_objects[i + 1]
                deliver_pos = deliver_obj["position"]
                order_weight = deliver_obj["w"]
                
                if can_go_direct(pos, deliver_pos, fuel):
                    cost = fuel_cost(pos, deliver_pos)
                    new_status = status.copy()
                    new_status[oid] = "delivered"
                    
                    deliver_node = Node(deliver_pos, {
                        "type": deliver_obj["type"],
                        "f": fuel - cost,
                        "w": weight - order_weight,
                        "orders_status": new_status
                    })
                    stack.append((deliver_node, path + [deliver_node], fuel_used + cost))
                else:
                    station, s_cost = find_nearest_station(pos, fuel, station_objects)
                    if station:
                        s_pos = station["position"]
                        if can_go_direct(s_pos, deliver_pos, max_fuel):
                            cost_to_deliver = fuel_cost(s_pos, deliver_pos)
                            total_cost = s_cost + cost_to_deliver
                            
                            new_status = status.copy()
                            new_status[oid] = "delivered"
                            
                            station_node = Node(s_pos, {
                                "type": station["type"],
                                "f": max_fuel,
                                "w": weight,
                                "orders_status": status.copy()
                            })
                            
                            deliver_node = Node(deliver_pos, {
                                "type": deliver_obj["type"],
                                "f": max_fuel - cost_to_deliver,
                                "w": weight - order_weight,
                                "orders_status": new_status
                            })
                            
                            stack.append((deliver_node, path + [station_node, deliver_node], fuel_used + total_cost))
    
    print(f"Explored {iter_count} states")
    
    if best["path"]:
        return {"nodes": best["path"], "total_fuel": round(best["fuel"], 2)}
    return {"nodes": [], "total_fuel": float('inf')}


def core(n, m, w, f, start, orders, stations):
    validate_data(n, m, w, f, start, orders, stations)
    root = Node(start, {"type": "start", "f": f, "w": 0, "max_w": w})
    order_objects = build_order_objects(orders)
    station_objects = build_station_objects(stations)
    return build_graph(root, order_objects, station_objects, w)


if __name__ == "__main__":
    with open("hell_sample.inp", "r") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    
    idx = 0
    n = int(lines[idx]); idx += 1
    m = int(lines[idx]); idx += 1
    w = int(lines[idx]); idx += 1
    f = int(lines[idx]); idx += 1
    start = [int(x) for x in lines[idx].split()]; idx += 1
    
    num_orders = int(lines[idx]); idx += 1
    orders = []
    for _ in range(num_orders):
        from_pos = [int(x) for x in lines[idx].split()]; idx += 1
        order_w = int(lines[idx]); idx += 1
        to_pos = [int(x) for x in lines[idx].split()]; idx += 1
        orders.append((from_pos, order_w, to_pos))
    
    num_station = int(lines[idx]); idx += 1
    stations = []
    for _ in range(num_station):
        station_pos = [int(x) for x in lines[idx].split()]; idx += 1
        stations.append(station_pos)

    best_path = core(n, m, w, f, start, orders, stations)
    
    if best_path["nodes"]:
        print(f"Best path found! Total fuel: {best_path['total_fuel']:.2f} liters")
        print(f"Path length: {len(best_path['nodes'])} steps")
        print("\nPath details:")
        for idx, node in enumerate(best_path['nodes']):
            pos = node.position
            meta = node.metadata
            print(f"  Step {idx}: {meta.get('type', 'unknown')} at {pos}, fuel={meta.get('f', 0):.2f}, weight={meta.get('w', 0)}")
        
        print("\nPath sequence:")
        path_seq = " -> ".join([f"{node.position}" for node in best_path['nodes']])
        print(f"  {path_seq}")
    else:
        print("No valid path found!")
