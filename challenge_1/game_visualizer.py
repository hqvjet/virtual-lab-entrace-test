import pygame
import sys
from core_algorithm import core

pygame.init()

CELL_SIZE = 30
INFO_WIDTH = 320
CONTROL_HEIGHT = 100

class GameVisualizer:
    def __init__(self, n, m, w, f, start, orders, stations, path_result):
        self.n = n
        self.m = m
        self.max_weight = w
        self.max_fuel = f
        self.start = start
        self.orders = orders
        self.stations = stations
        self.path = path_result["nodes"]
        self.total_fuel = path_result["total_fuel"]
        
        self.width = n * CELL_SIZE + INFO_WIDTH
        self.height = m * CELL_SIZE + CONTROL_HEIGHT
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption("Robot Delivery Visualization")
        
        self.current_step = 0
        self.animation_progress = 0.0
        self.playing = False
        self.speed = 1.0
        self.clock = pygame.time.Clock()
        self.frame_counter = 0
        
        self.font = pygame.font.Font(None, 24)
        self.title_font = pygame.font.Font(None, 28)
        self.label_font = pygame.font.Font(None, 18)
        
        self.colors = {
            'grid': (240, 240, 240),
            'line': (200, 200, 200),
            'robot': (255, 50, 50),
            'start': (50, 255, 50),
            'pickup': (255, 165, 0),
            'delivery': (0, 150, 255),
            'station': (255, 255, 0),
            'path': (100, 200, 100),
            'text': (0, 0, 0),
            'bg': (250, 250, 250),
            'delivered': (150, 150, 150)
        }
    
    def draw_grid(self):
        grid_surface = pygame.Surface((self.n * CELL_SIZE, self.m * CELL_SIZE))
        grid_surface.fill(self.colors['grid'])
        
        for i in range(self.n + 1):
            pygame.draw.line(grid_surface, self.colors['line'], 
                           (i * CELL_SIZE, 0), (i * CELL_SIZE, self.m * CELL_SIZE))
        for j in range(self.m + 1):
            pygame.draw.line(grid_surface, self.colors['line'], 
                           (0, j * CELL_SIZE), (self.n * CELL_SIZE, j * CELL_SIZE))
        
        self.screen.blit(grid_surface, (0, 0))
    
    def draw_path_trail(self):
        if self.current_step > 0:
            for i in range(self.current_step):
                node = self.path[i]
                x, y = node.position
                rect = pygame.Rect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, 
                                 CELL_SIZE - 4, CELL_SIZE - 4)
                pygame.draw.rect(self.screen, self.colors['path'], rect)
    
    def draw_stations(self):
        for station in self.stations:
            x, y = station
            center_x = x * CELL_SIZE + CELL_SIZE // 2
            center_y = y * CELL_SIZE + CELL_SIZE // 2
            
            # Draw gas pump shape (rectangle + nozzle)
            pump_width = CELL_SIZE // 2
            pump_height = int(CELL_SIZE * 0.6)
            pump_rect = pygame.Rect(center_x - pump_width // 2, 
                                   center_y - pump_height // 2,
                                   pump_width, pump_height)
            pygame.draw.rect(self.screen, self.colors['station'], pump_rect)
            pygame.draw.rect(self.screen, (180, 180, 0), pump_rect, 3)
            
            # Draw nozzle
            nozzle_points = [
                (center_x + pump_width // 2, center_y - 5),
                (center_x + pump_width // 2 + 8, center_y - 5),
                (center_x + pump_width // 2 + 8, center_y + 5),
                (center_x + pump_width // 2, center_y + 5)
            ]
            pygame.draw.polygon(self.screen, (200, 200, 0), nozzle_points)
            
            # Label
            label = self.font.render("⛽", True, (0, 0, 0))
            label_rect = label.get_rect(center=(center_x, center_y))
            self.screen.blit(label, label_rect)
    
    def draw_orders(self):
        current_node = self.path[self.current_step]
        current_status = current_node.metadata.get("orders_status", {})
        
        for idx, (pickup_pos, weight, delivery_pos) in enumerate(self.orders):
            status = current_status.get(idx, "pending")
            
            pickup_x, pickup_y = pickup_pos
            delivery_x, delivery_y = delivery_pos
            
            if status == "pending":
                # Draw pickup as PACKAGE BOX
                center_x = pickup_x * CELL_SIZE + CELL_SIZE // 2
                center_y = pickup_y * CELL_SIZE + CELL_SIZE // 2
                box_size = CELL_SIZE // 2
                
                # Box
                box_rect = pygame.Rect(center_x - box_size // 2,
                                      center_y - box_size // 2,
                                      box_size, box_size)
                pygame.draw.rect(self.screen, self.colors['pickup'], box_rect)
                pygame.draw.rect(self.screen, (200, 100, 0), box_rect, 3)
                
                # Cross on box (package tape)
                pygame.draw.line(self.screen, (200, 100, 0),
                               (center_x - box_size // 2, center_y),
                               (center_x + box_size // 2, center_y), 2)
                pygame.draw.line(self.screen, (200, 100, 0),
                               (center_x, center_y - box_size // 2),
                               (center_x, center_y + box_size // 2), 2)
                
                # Label
                label = self.label_font.render(f"#{idx}", True, (255, 255, 255))
                label_rect = label.get_rect(center=(center_x, center_y + box_size // 2 + 12))
                pygame.draw.rect(self.screen, (0, 0, 0), label_rect.inflate(4, 2))
                self.screen.blit(label, label_rect)
                
                # Draw delivery as GRAYED OUT HOUSE
                delivery_center_x = delivery_x * CELL_SIZE + CELL_SIZE // 2
                delivery_center_y = delivery_y * CELL_SIZE + CELL_SIZE // 2
                house_size = CELL_SIZE // 3
                
                # House base
                pygame.draw.rect(self.screen, (180, 180, 180),
                               (delivery_center_x - house_size // 2,
                                delivery_center_y - house_size // 4,
                                house_size, house_size // 2))
                # Roof (triangle)
                roof_points = [
                    (delivery_center_x, delivery_center_y - house_size // 2),
                    (delivery_center_x - house_size // 2, delivery_center_y - house_size // 4),
                    (delivery_center_x + house_size // 2, delivery_center_y - house_size // 4)
                ]
                pygame.draw.polygon(self.screen, (150, 150, 150), roof_points)
                
            elif status == "picked":
                # Draw delivery as ACTIVE HOUSE
                center_x = delivery_x * CELL_SIZE + CELL_SIZE // 2
                center_y = delivery_y * CELL_SIZE + CELL_SIZE // 2
                house_size = int(CELL_SIZE * 0.55)
                
                # House base
                base_rect = pygame.Rect(center_x - house_size // 2,
                                       center_y - house_size // 4,
                                       house_size, house_size // 2)
                pygame.draw.rect(self.screen, self.colors['delivery'], base_rect)
                pygame.draw.rect(self.screen, (0, 100, 200), base_rect, 3)
                
                # Roof (triangle)
                roof_points = [
                    (center_x, center_y - house_size // 2 - 2),
                    (center_x - house_size // 2 - 2, center_y - house_size // 4),
                    (center_x + house_size // 2 + 2, center_y - house_size // 4)
                ]
                pygame.draw.polygon(self.screen, (0, 120, 200), roof_points)
                pygame.draw.polygon(self.screen, (0, 80, 160), roof_points, 3)
                
                # Door
                door_width = house_size // 4
                door_height = house_size // 3
                pygame.draw.rect(self.screen, (100, 50, 0),
                               (center_x - door_width // 2,
                                center_y,
                                door_width, door_height))
                
                # Label
                label = self.label_font.render(f"#{idx}", True, (255, 255, 255))
                label_rect = label.get_rect(center=(center_x, center_y + house_size // 2 + 12))
                pygame.draw.rect(self.screen, (0, 100, 200), label_rect.inflate(4, 2))
                self.screen.blit(label, label_rect)
    
    def draw_robot(self):
        current_node = self.path[self.current_step]
        x1, y1 = current_node.position
        
        if self.current_step < len(self.path) - 1 and self.animation_progress > 0:
            next_node = self.path[self.current_step + 1]
            x2, y2 = next_node.position
            
            x = x1 + (x2 - x1) * self.animation_progress
            y = y1 + (y2 - y1) * self.animation_progress
        else:
            x, y = x1, y1
        
        center_x = int(x * CELL_SIZE + CELL_SIZE // 2)
        center_y = int(y * CELL_SIZE + CELL_SIZE // 2)
        robot_size = int(CELL_SIZE * 0.7)
        
        # Robot body (rounded rectangle)
        body_rect = pygame.Rect(center_x - robot_size // 2,
                               center_y - robot_size // 2,
                               robot_size, robot_size)
        pygame.draw.rect(self.screen, self.colors['robot'], body_rect, border_radius=8)
        pygame.draw.rect(self.screen, (200, 0, 0), body_rect, 4, border_radius=8)
        
        # Robot eyes
        eye_size = robot_size // 6
        eye_y = center_y - robot_size // 6
        pygame.draw.circle(self.screen, (255, 255, 255),
                         (center_x - robot_size // 4, eye_y), eye_size)
        pygame.draw.circle(self.screen, (255, 255, 255),
                         (center_x + robot_size // 4, eye_y), eye_size)
        pygame.draw.circle(self.screen, (0, 0, 0),
                         (center_x - robot_size // 4, eye_y), eye_size // 2)
        pygame.draw.circle(self.screen, (0, 0, 0),
                         (center_x + robot_size // 4, eye_y), eye_size // 2)
        
        # Robot antenna
        antenna_start = (center_x, center_y - robot_size // 2)
        antenna_end = (center_x, center_y - robot_size // 2 - 6)
        pygame.draw.line(self.screen, (200, 0, 0), antenna_start, antenna_end, 3)
        pygame.draw.circle(self.screen, (255, 200, 0), antenna_end, 4)
        
        # Wheels
        wheel_y = center_y + robot_size // 2
        pygame.draw.circle(self.screen, (50, 50, 50),
                         (center_x - robot_size // 3, wheel_y), robot_size // 8)
        pygame.draw.circle(self.screen, (50, 50, 50),
                         (center_x + robot_size // 3, wheel_y), robot_size // 8)
        
        # Label "ROBOT"
        label = self.label_font.render("🤖", True, (255, 255, 255))
        label_rect = label.get_rect(center=(center_x, center_y + robot_size // 2 + 14))
        pygame.draw.rect(self.screen, (255, 50, 50), label_rect.inflate(6, 2), border_radius=3)
        self.screen.blit(label, label_rect)
    
    def draw_info_panel(self):
        panel_x = self.n * CELL_SIZE
        panel_rect = pygame.Rect(panel_x, 0, INFO_WIDTH, self.m * CELL_SIZE)
        pygame.draw.rect(self.screen, self.colors['bg'], panel_rect)
        pygame.draw.line(self.screen, self.colors['line'], 
                        (panel_x, 0), (panel_x, self.m * CELL_SIZE), 2)
        
        current_node = self.path[self.current_step]
        fuel = current_node.metadata.get("f", 0)
        weight = current_node.metadata.get("w", 0)
        node_type = current_node.metadata.get("type", "unknown")
        pos = current_node.position
        
        y_offset = 15
        
        # Title
        title = self.title_font.render("📊 ROBOT STATUS", True, self.colors['text'])
        self.screen.blit(title, (panel_x + 10, y_offset))
        y_offset += 35
        
        # Step progress
        step_text = self.font.render(f"Step: {self.current_step + 1} / {len(self.path)}", True, (0, 0, 0))
        self.screen.blit(step_text, (panel_x + 10, y_offset))
        y_offset += 25
        
        # Step progress bar
        bar_width = INFO_WIDTH - 30
        bar_height = 18
        progress = (self.current_step + 1) / len(self.path)
        pygame.draw.rect(self.screen, (220, 220, 220), 
                        (panel_x + 10, y_offset, bar_width, bar_height), border_radius=9)
        pygame.draw.rect(self.screen, (50, 200, 50), 
                        (panel_x + 10, y_offset, int(bar_width * progress), bar_height), border_radius=9)
        pygame.draw.rect(self.screen, (100, 100, 100), 
                        (panel_x + 10, y_offset, bar_width, bar_height), 2, border_radius=9)
        y_offset += 30
        
        # Position
        pos_text = self.font.render(f"📍 Position: ({pos[0]}, {pos[1]})", True, (0, 0, 0))
        self.screen.blit(pos_text, (panel_x + 10, y_offset))
        y_offset += 25
        
        # Action type
        type_icon = {"start": "🏁", "finish": "🏁", "order_start": "📦", 
                    "order_end": "🏠", "station": "⛽"}.get(node_type.split("_")[0], "❓")
        type_text = self.font.render(f"{type_icon} Action: {node_type}", True, (0, 0, 0))
        self.screen.blit(type_text, (panel_x + 10, y_offset))
        y_offset += 30
        
        # Fuel gauge
        fuel_text = self.font.render(f"⛽ Fuel: {fuel:.1f} / {self.max_fuel}", True, (0, 0, 0))
        self.screen.blit(fuel_text, (panel_x + 10, y_offset))
        y_offset += 22
        
        fuel_ratio = fuel / self.max_fuel
        fuel_color = (255, 50, 50) if fuel_ratio < 0.3 else (255, 200, 0) if fuel_ratio < 0.6 else (50, 200, 50)
        pygame.draw.rect(self.screen, (220, 220, 220), 
                        (panel_x + 10, y_offset, bar_width, bar_height), border_radius=9)
        pygame.draw.rect(self.screen, fuel_color, 
                        (panel_x + 10, y_offset, int(bar_width * fuel_ratio), bar_height), border_radius=9)
        pygame.draw.rect(self.screen, (100, 100, 100), 
                        (panel_x + 10, y_offset, bar_width, bar_height), 2, border_radius=9)
        y_offset += 28
        
        # Weight gauge
        weight_text = self.font.render(f"📦 Load: {weight} / {self.max_weight} kg", True, (0, 0, 0))
        self.screen.blit(weight_text, (panel_x + 10, y_offset))
        y_offset += 22
        
        weight_ratio = weight / self.max_weight if self.max_weight > 0 else 0
        weight_color = (50, 150, 255) if weight_ratio < 0.8 else (255, 100, 0)
        pygame.draw.rect(self.screen, (220, 220, 220), 
                        (panel_x + 10, y_offset, bar_width, bar_height), border_radius=9)
        pygame.draw.rect(self.screen, weight_color, 
                        (panel_x + 10, y_offset, int(bar_width * weight_ratio), bar_height), border_radius=9)
        pygame.draw.rect(self.screen, (100, 100, 100), 
                        (panel_x + 10, y_offset, bar_width, bar_height), 2, border_radius=9)
        y_offset += 35
        
        # Total fuel used
        total_text = self.title_font.render(f"⛽ Total: {self.total_fuel:.2f}L", True, (255, 100, 0))
        self.screen.blit(total_text, (panel_x + 10, y_offset))
        y_offset += 35
        
        # Orders status section
        pygame.draw.line(self.screen, (200, 200, 200), 
                        (panel_x + 10, y_offset), (panel_x + INFO_WIDTH - 10, y_offset), 2)
        y_offset += 10
        
        orders_title = self.font.render("📋 ORDERS:", True, (0, 0, 0))
        self.screen.blit(orders_title, (panel_x + 10, y_offset))
        y_offset += 28
        
        status = current_node.metadata.get("orders_status", {})
        for idx in sorted(status.keys()):
            s = status[idx]
            icon_map = {
                "pending": "⏳",
                "picked": "🚚",
                "delivered": "✅"
            }
            color_map = {
                "pending": (150, 150, 150),
                "picked": (0, 150, 255),
                "delivered": (50, 200, 50)
            }
            icon = icon_map.get(s, "?")
            color = color_map.get(s, (0, 0, 0))
            
            status_text = self.font.render(f"{icon} Order #{idx}: {s.upper()}", True, color)
            self.screen.blit(status_text, (panel_x + 15, y_offset))
            y_offset += 24
    
    def draw_controls(self):
        control_y = self.m * CELL_SIZE
        control_rect = pygame.Rect(0, control_y, self.width, CONTROL_HEIGHT)
        pygame.draw.rect(self.screen, self.colors['bg'], control_rect)
        pygame.draw.line(self.screen, self.colors['line'], 
                        (0, control_y), (self.width, control_y), 2)
        
        # Left side - Controls
        controls = [
            "SPACE: Play/Pause",
            "←/→: Step by Step",
            "R: Reset",
            "↑/↓: Speed ±0.5x"
        ]
        
        x_offset = 20
        y_base = control_y + 10
        
        ctrl_title = self.font.render("CONTROLS:", True, (0, 0, 0))
        self.screen.blit(ctrl_title, (x_offset, y_base))
        
        for i, ctrl in enumerate(controls):
            text = self.label_font.render(ctrl, True, self.colors['text'])
            self.screen.blit(text, (x_offset + 10, y_base + 25 + i * 20))
        
        # Middle - Legend
        legend_x = 280
        legend_title = self.font.render("LEGEND:", True, (0, 0, 0))
        self.screen.blit(legend_title, (legend_x, y_base))
        
        # Robot icon
        pygame.draw.rect(self.screen, (255, 50, 50), (legend_x, y_base + 25, 18, 18), border_radius=3)
        text = self.label_font.render("= Robot Delivery", True, (0, 0, 0))
        self.screen.blit(text, (legend_x + 25, y_base + 25))
        
        # Package icon
        pygame.draw.rect(self.screen, (255, 165, 0), (legend_x, y_base + 47, 18, 18))
        pygame.draw.rect(self.screen, (200, 100, 0), (legend_x, y_base + 47, 18, 18), 2)
        text = self.label_font.render("= Pickup Point", True, (0, 0, 0))
        self.screen.blit(text, (legend_x + 25, y_base + 47))
        
        # House icon
        house_x = legend_x + 9
        house_y = y_base + 78
        pygame.draw.rect(self.screen, (0, 150, 255), (legend_x, y_base + 72, 18, 10))
        roof_pts = [(house_x, house_y - 6), (legend_x, house_y), (legend_x + 18, house_y)]
        pygame.draw.polygon(self.screen, (0, 120, 200), roof_pts)
        text = self.label_font.render("= Delivery Point", True, (0, 0, 0))
        self.screen.blit(text, (legend_x + 25, y_base + 69))
        
        # Gas station icon
        pygame.draw.rect(self.screen, (255, 255, 0), (legend_x + 450, y_base + 25, 18, 18))
        text = self.label_font.render("= Gas Station", True, (0, 0, 0))
        self.screen.blit(text, (legend_x + 475, y_base + 25))
        
        # Status
        status = "PLAYING" if self.playing else "PAUSED"
        status_color = (50, 200, 50) if self.playing else (200, 50, 50)
        status_text = self.title_font.render(status, True, status_color)
        self.screen.blit(status_text, (self.width - 150, control_y + 15))
        
        speed_text = self.font.render(f"Speed: {self.speed:.1f}x", True, (0, 0, 0))
        self.screen.blit(speed_text, (self.width - 150, control_y + 50))
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    self.playing = not self.playing
                
                elif event.key == pygame.K_LEFT:
                    self.current_step = max(0, self.current_step - 1)
                    self.animation_progress = 0.0
                
                elif event.key == pygame.K_RIGHT:
                    self.current_step = min(len(self.path) - 1, self.current_step + 1)
                    self.animation_progress = 0.0
                
                elif event.key == pygame.K_r:
                    self.current_step = 0
                    self.animation_progress = 0.0
                    self.playing = False
                
                elif event.key == pygame.K_UP:
                    self.speed = min(5.0, self.speed + 0.5)
                
                elif event.key == pygame.K_DOWN:
                    self.speed = max(0.5, self.speed - 0.5)
        
        return True
    
    def update(self):
        if self.playing and self.current_step < len(self.path) - 1:
            frames_per_step = max(10, int(30 / self.speed))
            progress_per_frame = 1.0 / frames_per_step
            
            self.animation_progress += progress_per_frame
            
            if self.animation_progress >= 1.0:
                self.animation_progress = 0.0
                self.current_step += 1
                
                if self.current_step >= len(self.path) - 1:
                    self.current_step = len(self.path) - 1
                    self.animation_progress = 0.0
                    self.playing = False
    
    def render(self):
        self.screen.fill(self.colors['bg'])
        self.draw_grid()
        self.draw_path_trail()
        self.draw_stations()
        self.draw_orders()
        self.draw_robot()
        self.draw_info_panel()
        self.draw_controls()
        pygame.display.flip()
    
    def run(self):
        running = True
        while running:
            running = self.handle_events()
            self.update()
            self.render()
            self.clock.tick(30)
        
        pygame.quit()


if __name__ == "__main__":
    with open("samples/hell_sample.inp", "r") as f:
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
    
    print("Computing optimal path...")
    path_result = core(n, m, w, f, start, orders, stations)
    
    if path_result["nodes"]:
        print(f"Path found! Total fuel: {path_result['total_fuel']:.2f} liters")
        print(f"Steps: {len(path_result['nodes'])}")
        print("\nStarting visualization...")
        
        visualizer = GameVisualizer(n, m, w, f, start, orders, stations, path_result)
        visualizer.run()
    else:
        print("No path found!")
