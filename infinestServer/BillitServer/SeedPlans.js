const mongoose = require("mongoose");
const { PlanCategory, Plan, Feature } = require("./models/mongoModels");

// Load environment variables
require('dotenv').config();

mongoose.connect(process.env.BILLIT_MONGO_URI || "mongodb://127.0.0.1:27017/billit")
    .then(() => {
        console.log("✅ Connected to MongoDB");
        return seedPlanCategoriesAndServicePlans();
    })
    .catch(err => console.error("❌ MongoDB connection error:", err));

async function seedPlanCategoriesAndServicePlans() {
    try {
        // 1️⃣ Seed Plan Categories (ensure required categories exist)
        const categories = [
            { _id: "Sales", name: "Sales" },
            { _id: "Service", name: "Service" },
            { _id: "Enterprise", name: "Enterprise" },
            { _id: "Sales_Service", name: "Sales + Service" },
            { _id: "Manager", name: "Manager" }
        ];

        for (const cat of categories) {
            await PlanCategory.findOneAndUpdate(
                { _id: cat._id },
                { $set: cat },
                { upsert: true }
            );
        }
        console.log("✅ Seeded Plan Categories");

        // 2️⃣ Seed Service Plans (reset and recreate)
        const categoryId = "Service";
        await Plan.deleteMany({ category_id: categoryId });
        // Note: Do not globally delete all features; we'll replace per-plan below

        const plans = [
            {
                _id: "service-basic",
                name: "Basic",
                description: "Ideal for new mobile repair shops starting out with basic restrictions and ads.",
                originalPrice: "199",
                price: "0",
                savePercentage: 100,
                term: "Free Plan",
                bonusOffer: null,
                renewalPrice: "Free with ads",
                renewalTerm: "LifeTime",
                branchLimit: 1,
                isPopular: false,
                features: [
                    { feature_key: "entry_limit", type: "limit", config: { totalPages: 30, entriesPerPage: 15 }, description: "30 pages × 15 records" },
                    { feature_key: "dealer_mobile_create_limit", type: "limit", config: { maxPerCreation: 5 }, description: "Dealer mobile creation limit: 5" },
                    { feature_key: "allow_paper_billing", type: "boolean", enabled: true, description: "Paper billing allowed" },
                    { feature_key: "allow_whatsapp_billing", type: "boolean", enabled: false, description: "WhatsApp billing not allowed" },
                    { feature_key: "dashboard_enabled", type: "boolean", enabled: false, description: "Dashboard disabled" },
                    { feature_key: "expense_tracker_enabled", type: "boolean", enabled: false, description: "Expense tracker disabled" },
                    { feature_key: "product_inventory_enabled", type: "boolean", enabled: false, description: "Product inventory disabled" },
                    { feature_key: "notifications_enabled", type: "boolean", enabled: false, description: "Notifications enabled" },
                    { feature_key: "show_ads", type: "boolean", enabled: true, description: "Ads displayed" },
                ]
            },
            {
                _id: "service-gold",
                name: "Gold",
                description: "For growing shops needing smart workflow tools with advanced features.",
                originalPrice: "999",
                price: "399",
                savePercentage: 60,
                term: "Monthly Plan",
                bonusOffer: "null",
                renewalPrice: "399",
                renewalTerm: "per month",
                branchLimit: 1,
                isPopular: true,
                features: [
                    { feature_key: "entry_limit", type: "limit", config: { totalPages: 1, entriesPerPage: 15 }, description: "40 pages × 15 records" },
                    { feature_key: "dealer_mobile_create_limit", type: "limit", config: { maxPerCreation: 10 }, description: "Dealer mobile creation limit: 10" },
                    { feature_key: "allow_paper_billing", type: "boolean", enabled: true, description: "Paper billing allowed" },
                    { feature_key: "allow_whatsapp_billing", type: "boolean", enabled: true, description: "WhatsApp billing allowed" },
                    { feature_key: "dashboard_enabled", type: "boolean", enabled: true, description: "Dashboard enabled" },
                    { feature_key: "expense_tracker_enabled", type: "boolean", enabled: false, description: "Expense tracker enabled" },
                    { feature_key: "product_inventory_enabled", type: "boolean", enabled: false, description: "Product inventory enabled" },
                    { feature_key: "notifications_enabled", type: "boolean", enabled: true, description: "Notifications enabled" },
                    { feature_key: "show_ads", type: "boolean", enabled: false, description: "Ads removed" },
                ]
            },
            {
                _id: "service-premium",
                name: "Premium",
                description: "Best for high-volume service centers or chains with premium features.",
                originalPrice: "1999",
                price: "499",
                savePercentage: 75,
                term: "Monthly Plan",
                bonusOffer: "null",
                renewalPrice: "499",
                renewalTerm: "per month",
                branchLimit: 1,
                isPopular: false,
                features: [
                    { feature_key: "entry_limit", type: "limit", config: { totalPages: 60, entriesPerPage: 15 }, description: "60 pages × 15 records" },
                    { feature_key: "dealer_mobile_create_limit", type: "limit", config: { maxPerCreation: 30 }, description: "Dealer mobile creation limit: 30" },
                    { feature_key: "allow_paper_billing", type: "boolean", enabled: true, description: "Paper billing allowed" },
                    { feature_key: "allow_whatsapp_billing", type: "boolean", enabled: true, description: "WhatsApp billing allowed" },
                    { feature_key: "dashboard_enabled", type: "boolean", enabled: true, description: "Dashboard enabled" },
                    { feature_key: "expense_tracker_enabled", type: "boolean", enabled: true, description: "Expense tracker enabled" },
                    { feature_key: "product_inventory_enabled", type: "boolean", enabled: true, description: "Product inventory enabled" },
                    { feature_key: "notifications_enabled", type: "boolean", enabled: true, description: "Notifications enabled" },
                    { feature_key: "show_ads", type: "boolean", enabled: false, description: "Ads removed" },
                ]
            }
        ];



        for (const planData of plans) {
            const plan = await Plan.findOneAndUpdate(
                { _id: planData._id },
                { ...planData, category_id: categoryId },
                { upsert: true, new: true }
            );

            await Feature.deleteMany({ plan_id: plan._id });

            const featureDocs = planData.features.map(f => {
                const feature = {
                    plan_id: plan._id,
                    feature_key: f.feature_key,
                    type: f.type,
                    enabled: f.enabled,
                    config: f.config,
                    description: f.description
                };
                if (f.type === "limit" && f.config) {
                    feature.config = f.config;
                }
                if (f.type === "boolean") {
                    feature.enabled = f.enabled;
                }
                return feature;
            });

            await Feature.insertMany(featureDocs);
        }

        console.log("✅ Seeded Service plans");

        // 3️⃣ Seed Sales plans (demo)
    const salesPlans = [
            {
        _id: 'sales-basic',
                name: 'Basic',
                category_id: 'Sales',
                price: "0",
                term: "Free Plan",
                features: [
                    { feature_key: "sales_products_limit", type: "limit", config: { totalPages: 5 }, description: "5 products" },
                    { feature_key: "show_ads", type: "boolean", enabled: true, description: "Ads shown" },
                ],
            },
            {
                _id: 'sales-gold',
                name: 'Gold',
                category_id: 'Sales',
                price: "299",
                term: "Monthly Plan",
                features: [
                    { feature_key: "sales_products_limit", type: "limit", config: { totalPages: 100 }, description: "100 products" },
                    { feature_key: "sales_analytics", type: "boolean", enabled: true, description: "Basic analytics" },
                    { feature_key: "show_ads", type: "boolean", enabled: false, description: "No ads" },
                ],
            },
            {
                _id: 'sales-premium',
                name: 'Premium',
                category_id: 'Sales',
                price: "399",
                term: "Monthly Plan",
                features: [
                    { feature_key: "sales_products_limit", type: "limit", config: { totalPages: 999999 }, description: "Unlimited products" },
                    { feature_key: "sales_analytics", type: "boolean", enabled: true, description: "Advanced analytics" },
                    { feature_key: "priority_support", type: "boolean", enabled: true, description: "Priority support" },
                ],
            },
        ];

    for (const planData of salesPlans) {
            const plan = await Plan.findOneAndUpdate(
        { _id: planData._id },
        { ...planData },
                { upsert: true, new: true }
            );
            await Feature.deleteMany({ plan_id: plan._id });
            const featureDocs = planData.features.map(f => ({
                plan_id: plan._id,
                feature_key: f.feature_key,
                type: f.type,
                enabled: f.enabled,
                config: f.config,
                description: f.description
            }));
            await Feature.insertMany(featureDocs);
        }
        console.log("✅ Seeded Sales plans");

        // 4️⃣ Seed Enterprise plans (demo)
    const enterprisePlans = [
            {
        _id: 'enterprise-basic',
                name: 'Basic',
                category_id: 'Enterprise',
                price: "0",
                term: "Free Plan",
                features: [
                    { feature_key: "branch_limit", type: "limit", config: { totalPages: 2 }, description: "2 branches" },
                    { feature_key: "roles", type: "boolean", enabled: true, description: "Basic roles" },
                ],
            },
            {
                _id: 'enterprise-gold',
                name: 'Gold',
                category_id: 'Enterprise',
                price: "999",
                term: "Monthly Plan",
                features: [
                    { feature_key: "branch_limit", type: "limit", config: { totalPages: 10 }, description: "10 branches" },
                    { feature_key: "security", type: "boolean", enabled: true, description: "SSO & audit logs" },
                    { feature_key: "support", type: "boolean", enabled: true, description: "Priority support" },
                ],
            },
            {
                _id: 'enterprise-premium',
                name: 'Premium',
                category_id: 'Enterprise',
                price: "1499",
                term: "Monthly Plan",
                features: [
                    { feature_key: "branch_limit", type: "limit", config: { totalPages: 999999 }, description: "Unlimited branches" },
                    { feature_key: "sla", type: "boolean", enabled: true, description: "SLA + dedicated manager" },
                    { feature_key: "integrations", type: "boolean", enabled: true, description: "Custom integrations" },
                ],
            },
        ];

    for (const planData of enterprisePlans) {
            const plan = await Plan.findOneAndUpdate(
        { _id: planData._id },
        { ...planData },
                { upsert: true, new: true }
            );
            await Feature.deleteMany({ plan_id: plan._id });
            const featureDocs = planData.features.map(f => ({
                plan_id: plan._id,
                feature_key: f.feature_key,
                type: f.type,
                enabled: f.enabled,
                config: f.config,
                description: f.description
            }));
            await Feature.insertMany(featureDocs);
        }
        console.log("✅ Seeded Enterprise plans");

        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }

}

