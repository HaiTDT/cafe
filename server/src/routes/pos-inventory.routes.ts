import { Router } from "express";
import { posInventoryController } from "../controllers/pos-inventory.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posInventoryRouter = Router();

// Ingredients CRUD (Nguyên liệu)
posInventoryRouter.get("/ingredients", authenticatePosJwt, posInventoryController.listIngredients);
posInventoryRouter.post("/ingredients", authenticatePosJwt, requirePosAdmin, posInventoryController.createIngredient);
posInventoryRouter.put("/ingredients/:id", authenticatePosJwt, requirePosAdmin, posInventoryController.updateIngredient);
posInventoryRouter.delete("/ingredients/:id", authenticatePosJwt, requirePosAdmin, posInventoryController.deleteIngredient);

// Recipes (Định lượng công thức)
posInventoryRouter.get("/recipes/product/:productId", authenticatePosJwt, posInventoryController.getRecipe);
posInventoryRouter.post("/recipes/product/:productId", authenticatePosJwt, requirePosAdmin, posInventoryController.updateRecipe);

// Branch Stock (Tồn kho chi nhánh)
posInventoryRouter.get("/branch-stock", authenticatePosJwt, posInventoryController.listBranchStock);
posInventoryRouter.put("/branch-stock/update-min-stock", authenticatePosJwt, requirePosAdmin, posInventoryController.updateMinStock);

// Stock Transactions (Nhập/Xuất kho)
posInventoryRouter.get("/transactions", authenticatePosJwt, posInventoryController.listTransactions);
posInventoryRouter.post("/transactions/import", authenticatePosJwt, requirePosAdmin, posInventoryController.createImport);
posInventoryRouter.post("/transactions/export", authenticatePosJwt, requirePosAdmin, posInventoryController.createExport);

// Audits (Kiểm kho)
posInventoryRouter.get("/audits", authenticatePosJwt, posInventoryController.listAudits);
posInventoryRouter.post("/audits", authenticatePosJwt, requirePosAdmin, posInventoryController.createAudit);
posInventoryRouter.put("/audits/:id/submit", authenticatePosJwt, posInventoryController.submitAudit);
posInventoryRouter.post("/audits/:id/adjust", authenticatePosJwt, requirePosAdmin, posInventoryController.adjustAudit);

// Suppliers (Nhà cung cấp)
posInventoryRouter.get("/suppliers", authenticatePosJwt, posInventoryController.listSuppliers);
posInventoryRouter.post("/suppliers", authenticatePosJwt, requirePosAdmin, posInventoryController.createSupplier);
posInventoryRouter.put("/suppliers/:id", authenticatePosJwt, requirePosAdmin, posInventoryController.updateSupplier);
posInventoryRouter.delete("/suppliers/:id", authenticatePosJwt, requirePosAdmin, posInventoryController.deleteSupplier);
