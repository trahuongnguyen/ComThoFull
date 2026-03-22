package com.example.be_restaurant.util;

import com.example.be_restaurant.entity.*;
import com.example.be_restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final FoodRepository foodRepository;
    private final PasswordEncoder passwordEncoder;
    private final FloorRepository floorRepository;
    private final DeskRepository deskRepository;

    @Override
    public void run(String... args) {

        initUser();
        initCategories();
        initFoods();
        initFloorAndDesk();
    }

    // ================= USER =================
    private void initUser() {
        // ===== ADMIN =====
        userRepository.findByUsernameAndStatus("systemAdmin", true)
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername("systemAdmin");
                    user.setPassword(passwordEncoder.encode("systemAdmin"));
                    user.setRole(User.Role.ADMIN);
                    user.setFullName("System Admin");
                    user.setStatus(true);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                });

        // ===== EMPLOYEE =====
        userRepository.findByUsernameAndStatus("employee", true)
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername("employee");
                    user.setPassword(passwordEncoder.encode("employee"));
                    user.setRole(User.Role.EMPLOYEE);
                    user.setFullName("Employee");
                    user.setStatus(true);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                });

    }

    // ================= FLOOR + DESK =================
    private void initFloorAndDesk() {

        Floor mangVe = createFloorIfNotExists("MANG VỀ");
        Floor tang1  = createFloorIfNotExists("TẦNG 1");
        Floor tang2  = createFloorIfNotExists("TẦNG 2");

        // ---- MANG VỀ: Mang về 01 -> 10 ----
        for (int i = 1; i <= 10; i++) {
            createDeskIfNotExists(String.format("Mang về %02d", i), mangVe);
        }

        // ---- TẦNG 1: Bàn 1A -> 5C ----
        for (int i = 1; i <= 5; i++) {
            for (char c = 'A'; c <= 'C'; c++) {
                createDeskIfNotExists("Bàn " + i + c, tang1);
            }
        }

        // ---- TẦNG 2: Bàn 6A -> 15C ----
        for (int i = 6; i <= 15; i++) {
            for (char c = 'A'; c <= 'C'; c++) {
                createDeskIfNotExists("Bàn " + i + c, tang2);
            }
        }
    }

    private Floor createFloorIfNotExists(String name) {
        return floorRepository.findByNameAndStatus(name, true)
                .orElseGet(() -> {
                    Floor floor = new Floor();
                    floor.setName(name);
                    floor.setStatus(true);
                    floor.setCreatedAt(LocalDateTime.now());
                    floor.setUpdatedAt(LocalDateTime.now());
                    return floorRepository.save(floor);
                });
    }

    private void createDeskIfNotExists(String name, Floor floor) {
        if (!deskRepository.existsByNameAndFloorAndStatus(name, floor, true)) {
            Desk desk = new Desk();
            desk.setName(name);
            desk.setFloor(floor);
            desk.setCapacity(4);
            desk.setCurrentStatus(Desk.DeskStatus.AVAILABLE);
            desk.setStatus(true);
            desk.setCreatedAt(LocalDateTime.now());
            desk.setUpdatedAt(LocalDateTime.now());
            deskRepository.save(desk);
        }
    }

    // ================= CATEGORY =================
    private void initCategories() {
        List<String> categories = List.of(
                "Món đặc biệt",
                "Cơm thố heo",
                "Cơm thố gà",
                "Cơm thố bò",
                "Cơm thố mix vị",
                "Cơm trắng",
                "Món gọi thêm",
                "Đồ uống"
        );

        for (String name : categories) {
            categoryRepository.findByNameAndStatus(name, true)
                    .orElseGet(() -> {
                        Category category = new Category();
                        category.setName(name);
                        category.setStatus(true);
                        category.setCreatedAt(LocalDateTime.now());
                        category.setUpdatedAt(LocalDateTime.now());
                        return categoryRepository.save(category);
                    });
        }
    }

    // ================= FOOD =================
    private void initFoods() {

        Category monDacBiet = getCategory("Món đặc biệt");
        Category comThoHeo = getCategory("Cơm thố heo");
        Category comThoGa = getCategory("Cơm thố gà");
        Category comThoBo = getCategory("Cơm thố bò");
        Category comThoMix = getCategory("Cơm thố mix vị");
        Category comTrang = getCategory("Cơm trắng");
        Category monThem = getCategory("Món gọi thêm");
        Category doUong = getCategory("Đồ uống");

        // ---- Món đặc biệt ----
        food("Thố đặc biệt", 70000, false, monDacBiet);
        food("Bánh mì chảo xá xíu", 50000, false, monDacBiet);
        food("Bánh mì chảo bò", 55000, false, monDacBiet);
        food("Bánh mì chảo ngỗng", 55000, false, monDacBiet);
        food("Bánh mì thêm", 5000, false, monDacBiet);
        food("Pate - 1 miếng", 10000, false, monDacBiet);
        food("Khoai tây - 100g", 10000, false, monDacBiet);
        food("Xúc xích - 1 cái", 10000, false, monDacBiet);
        food("Thịt bò - 100g", 50000, false, monDacBiet);
        food("Thịt xá xíu - 100g", 45000, false, monDacBiet);
        food("Thịt ngỗng - 100g", 50000, false, monDacBiet);

        // ---- Cơm thố heo ----
        food("Thố xá xíu", 50000, true, comThoHeo);
        food("Thố sườn nướng", 55000, true, comThoHeo);
        food("Thố sườn sốt chua ngọt", 55000, true, comThoHeo);
        food("Thố sườn sốt cay", 55000, true, comThoHeo);
        food("Thố ốp la", 30000, true, comThoHeo);
        food("Thố rau củ", 20000, true, comThoHeo);

        // ---- Cơm thố gà ----
        food("Thố gà áp chảo", 45000, true, comThoGa);
        food("Thố đùi gà nướng", 55000, true, comThoGa);
        food("Thố lườn ngỗng", 55000, true, comThoGa);
        food("Thố gà xào nấm", 55000, true, comThoGa);
        food("Thố gà xào dứa", 55000, true, comThoGa);
        food("Thố gà sốt chua ngọt", 50000, true, comThoGa);
        food("Thố gà sốt cay", 50000, true, comThoGa);

        // ---- Cơm thố bò ----
        food("Thố bò xào lăn", 50000, true, comThoBo);
        food("Thố bò xào nấm", 55000, true, comThoBo);
        food("Thố bò xào đậu đũa", 55000, true, comThoBo);
        food("Thố bò sốt tiêu đen", 55000, true, comThoBo);

        // ---- Cơm thố mix ----
        food("Thố bò - xíu", 55000, true, comThoMix);
        food("Thố bò - gà", 55000, true, comThoMix);
        food("Thố ngỗng - xíu", 65000, true, comThoMix);
        food("Thố sườn - xíu", 65000, true, comThoMix);
        food("Thố gà - xíu", 55000, true, comThoMix);

        // ---- Cơm trắng ----
        food("Trắng xá xíu", 45000, false, comTrang);
        food("Trắng sườn nướng", 50000, false, comTrang);
        food("Trắng sườn chua ngọt", 50000, false, comTrang);
        food("Trắng sườn cay", 50000, false, comTrang);
        food("Trắng lườn ngỗng", 55000, false, comTrang);
        food("Trắng đùi gà nướng", 50000, false, comTrang);
        food("Trắng gà áp chảo", 45000, false, comTrang);

        // ---- Món gọi thêm ----
        food("Trứng ốp la", 10000, false, monThem);
        food("Trứng tráng hành", 15000, false, monThem);
        food("Bắp cải xào", 25000, false, monThem);
        food("Bắp cải luộc", 25000, false, monThem);
        food("Đậu đũa xào", 25000, false, monThem);
        food("Đậu đũa luộc", 25000, false, monThem);

        // ---- Đồ uống ----
        food("Trà quất", 15000, false, doUong);
        food("Sữa đậu nành", 12000, false, doUong);
        food("Coca", 15000, false, doUong);
        food("Pepsi", 15000, false, doUong);
        food("7up", 15000, false, doUong);
        food("Bò húc", 18000, false, doUong);
        food("Nước Dasani", 10000, false, doUong);
        food("Bia Sài Gòn", 20000, false, doUong);
    }

    // ================= HELPER =================
    private Category getCategory(String name) {
        return categoryRepository.findByNameAndStatus(name, true)
                .orElseThrow(() -> new RuntimeException("Category not found: " + name));
    }

    private void food(String name, double price, boolean canUpSize, Category category) {
        if (!foodRepository.existsByNameAndCategory(name, category)) {
            Food food = new Food();
            food.setName(name);
            food.setPrice(price);
            food.setCanUpSize(canUpSize);
            food.setUpSizePrice(15000.0);
            food.setCategory(category);
            food.setStatus(true);
            food.setCreatedAt(LocalDateTime.now());
            food.setUpdatedAt(LocalDateTime.now());
            foodRepository.save(food);
        }
    }
}
