def validate_data(n, m, w, f, start, orders, stations):
    if n <= 0 or m <= 0:
        raise ValueError("Grid dimensions must be positive integers.")
    if w <= 0:
        raise ValueError("Maximum weight capacity must be a positive integer.")
    if f <= 0:
        raise ValueError("Number of fuel units must be a positive integer.")
    if len(start) != 2 or not all(0 <= coord < dim for coord, dim in zip(start, (n, m))):
        raise ValueError("Start position is out of grid bounds.")
    
    for from_pos, order_w, to_pos in orders:
        if len(from_pos) != 2 or not all(0 <= coord < dim for coord, dim in zip(from_pos, (n, m))):
            raise ValueError("Order 'from' position is out of grid bounds.")
        if order_w <= 0 or order_w > w:
            raise ValueError("Order weight must be positive and within the maximum weight capacity.")
        if len(to_pos) != 2 or not all(0 <= coord < dim for coord, dim in zip(to_pos, (n, m))):
            raise ValueError("Order 'to' position is out of grid bounds.")
    
    for station_pos in stations:
        if len(station_pos) != 2 or not all(0 <= coord < dim for coord, dim in zip(station_pos, (n, m))):
            raise ValueError("Station position is out of grid bounds.")
        
def build_order_objects(orders):
    objs = []
    for id, order in enumerate(orders):
        objs.append({
            "position": order[0],
            "w": order[1],
            "type": f"order_start_{id}"
        })
        objs.append({
            "position": order[2],
            "w": order[1],
            "type": f"order_end_{id}"
        })

    return objs

def build_station_objects(stations):
    objs = []
    for id, station in enumerate(stations):
        objs.append({
            "position": station,
            "type": f"station_{id}"
        })
    return objs