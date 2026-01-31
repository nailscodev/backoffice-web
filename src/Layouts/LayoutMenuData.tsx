import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();
    const { t } = useTranslation();

    // Keep minimal original state used by the template
    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [iscurrentState, setIscurrentState] = useState('Dashboard');

    // Admin specific sections
    const [isIngresos, setIsIngresos] = useState<boolean>(false);
    const [isReservas, setIsReservas] = useState<boolean>(false);
    const [isClientes, setIsClientes] = useState<boolean>(false);
    const [isServicios, setIsServicios] = useState<boolean>(false);
    const [isStaffSection, setIsStaffSection] = useState<boolean>(false);
    const [isReportes, setIsReportes] = useState<boolean>(false);
    const [isConfiguracion, setIsConfiguracion] = useState<boolean>(false);

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            if (!ul) return;
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'Dashboard') {
            setIsDashboard(false);
        }
    }, [history, iscurrentState, isDashboard]);

    const menuItems: any = [
        { label: t('menu.admin.header'), isHeader: true },

        // 1) Dashboard (Inicio)
        {
            id: "admin-dashboard",
            label: t('menu.admin.dashboard'),
            icon: "ri-dashboard-2-line",
            link: "/dashboard",
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsDashboard(!isDashboard);
                setIscurrentState('Dashboard');
                updateIconSidebar(e);
            }
        },

        // 2) Administración de Ingresos y Egresos
        {
            id: "admin-ingresos",
            label: t('menu.admin.revenue.title'),
            icon: "ri-wallet-3-line",
            link: "/ingresos",
            click: function (e: any) {
                e.preventDefault();
                setIsIngresos(!isIngresos);
                setIscurrentState('Ingresos');
                updateIconSidebar(e);
            },
            stateVariables: isIngresos,
            subItems: [
                {
                    id: "ingresos-diarios",
                    label: t('menu.admin.revenue.daily_revenue'),
                    // Navigate to Invoice List
                    link: "/apps-invoices-list",
                    parentId: "admin-ingresos",
                    isChildItem: true,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.admin.revenue.completed_shifts_list'),
                            link: "/apps-invoices-list",
                            parentId: "ingresos-diarios",
                            click: function (e: any) {
                                e.preventDefault();
                                setIscurrentState('Ingresos');
                                updateIconSidebar(e);
                                history('/apps-invoices-list');
                            }
                        },
                    ]
                },
                {
                    id: "ajustes-manuales",
                    label: t('menu.admin.revenue.manual_adjustments'),
                    // Navigate to Invoice Create
                    link: "/apps-invoices-create",
                    parentId: "admin-ingresos",
                    isChildItem: true,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.admin.revenue.external_transactions'),
                            link: "/apps-invoices-create",
                            parentId: "ajustes-manuales",
                            click: function (e: any) {
                                e.preventDefault();
                                setIscurrentState('Ingresos');
                                updateIconSidebar(e);
                                history('/apps-invoices-create');
                            }
                        },
                    ]
                },
            ],
        },

        // 3) Gestión de Reservas
        {
            id: "admin-reservas",
            label: t('menu.admin.reservations.title'),
            icon: "ri-calendar-line",
            link: "/reservas",
            click: function (e: any) {
                e.preventDefault();
                setIsReservas(!isReservas);
                setIscurrentState('Reservas');
                updateIconSidebar(e);
            },
            stateVariables: isReservas,
            subItems: [
                { 
                    id: "historial-reservas", 
                    label: t('menu.admin.reservations.list'), 
                    link: "/apps-ecommerce-orders", 
                    parentId: "admin-reservas" 
                },
                { 
                    id: "vista-calendario", 
                    label: t('menu.admin.reservations.calendar_view'), 
                    link: "/apps-calendar", 
                    parentId: "admin-reservas",
                    icon: "ri-time-line",
                    disabled: true,
                    badgeName: "Coming Soon",
                    badgeColor: "info"
                },
            ],
        },

        // 4) Servicios
        {
            id: "admin-servicios",
            label: t('menu.admin.services.title'),
            icon: "ri-scissors-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsServicios(!isServicios);
                setIscurrentState('Servicios');
                updateIconSidebar(e);
            },
            stateVariables: isServicios,
            subItems: [
                { id: "categories", label: t('menu.admin.services.categories'), link: "/servicios/categories", parentId: "admin-servicios" },
                { id: "servicios-list", label: t('menu.admin.services.list'), link: "/servicios", parentId: "admin-servicios" },
                { id: "addons", label: t('menu.admin.services.addons'), link: "/servicios/addons", parentId: "admin-servicios" },
            ],
        },

        // 5) Profesionales / Staff (point to Team page)
        {
            id: "admin-staff",
            label: t('menu.admin.staff.title'),
            icon: "ri-user-3-line",
            // Use the Team page route
            link: "/pages-team",
            click: function (e: any) {
                e.preventDefault();
                setIsStaffSection(!isStaffSection);
                setIscurrentState('Staff');
                updateIconSidebar(e);
                // navigate to the Team page (Pages -> Team)
                history('/pages-team');
            },
            stateVariables: isStaffSection,
        },

        // 6) Clientes
        {
            id: "admin-clientes",
            label: t('menu.admin.customers.title'),
            icon: "ri-group-line",
            link: "/apps-ecommerce-customers",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Clientes');
                updateIconSidebar(e);
                history('/apps-ecommerce-customers');
            },
        },

        // 7) Reportes
        {
            id: "admin-reportes",
            label: t('menu.admin.reports.title'),
            icon: "ri-time-line",
            link: "/#",
            disabled: true,
            badgeName: "Coming Soon",
            badgeColor: "info",
            click: function (e: any) {
                e.preventDefault();
                // Don't navigate or expand - it's disabled
            },
            stateVariables: false,
        },

        // 8) Configuración
        {
            id: "admin-config",
            label: t('menu.admin.settings.title'),
            icon: "ri-settings-2-line",
            link: "/config",
            click: function (e: any) {
                e.preventDefault();
                setIsConfiguracion(!isConfiguracion);
                setIscurrentState('Configuracion');
                updateIconSidebar(e);
            },
            stateVariables: isConfiguracion,
            subItems: [
                { id: "usuarios-roles", label: t('menu.admin.settings.users_roles'), link: "/config/usuarios", parentId: "admin-config" },
                { id: "idioma", label: t('menu.admin.settings.language'), link: "/config/idioma", parentId: "admin-config", icon: "ri-time-line", disabled: true, badgeName: "Coming Soon", badgeColor: "info" },
            ],
        }
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

// Exporta el array de pantallas fuera del componente para evitar el error de scope
// Si necesitas el array de pantallas para asignación de roles, exporta solo la estructura, sin hooks
const menuData = [
    { label: 'menu.admin.header', isHeader: true },
    { id: "admin-dashboard", label: 'menu.admin.dashboard', icon: "ri-dashboard-2-line", link: "/dashboard" },
    { id: "admin-ingresos", label: 'menu.admin.revenue.title', icon: "ri-wallet-3-line", link: "/ingresos", subItems: [
        { id: "ingresos-diarios", label: 'menu.admin.revenue.daily_revenue', link: "/apps-invoices-list", parentId: "admin-ingresos", childItems: [
            { id: 1, label: 'menu.admin.revenue.completed_shifts_list', link: "/apps-invoices-list", parentId: "ingresos-diarios" }
        ] },
        { id: "ajustes-manuales", label: 'menu.admin.revenue.manual_adjustments', link: "/apps-invoices-create", parentId: "admin-ingresos", childItems: [
            { id: 1, label: 'menu.admin.revenue.external_transactions', link: "/apps-invoices-create", parentId: "ajustes-manuales" }
        ] }
    ] },
    { id: "admin-reservas", label: 'menu.admin.reservations.title', icon: "ri-calendar-line", link: "/reservas", subItems: [
        { id: "historial-reservas", label: 'menu.admin.reservations.list', link: "/apps-ecommerce-orders", parentId: "admin-reservas" },
        { id: "vista-calendario", label: 'menu.admin.reservations.calendar_view', link: "/apps-calendar", parentId: "admin-reservas", icon: "ri-time-line", disabled: true, badgeName: "Coming Soon", badgeColor: "info" }
    ] },
    { id: "admin-servicios", label: 'menu.admin.services.title', icon: "ri-scissors-line", link: "/#", subItems: [
        { id: "categories", label: 'menu.admin.services.categories', link: "/servicios/categories", parentId: "admin-servicios" },
        { id: "servicios-list", label: 'menu.admin.services.list', link: "/servicios", parentId: "admin-servicios" },
        { id: "addons", label: 'menu.admin.services.addons', link: "/servicios/addons", parentId: "admin-servicios" }
    ] },
    { id: "admin-staff", label: 'menu.admin.staff.title', icon: "ri-user-3-line", link: "/pages-team" },
    { id: "admin-clientes", label: 'menu.admin.customers.title', icon: "ri-group-line", link: "/apps-ecommerce-customers" },
    { id: "admin-reportes", label: 'menu.admin.reports.title', icon: "ri-time-line", link: "/#", disabled: true, badgeName: "Coming Soon", badgeColor: "info" },
    { id: "admin-config", label: 'menu.admin.settings.title', icon: "ri-settings-2-line", link: "/config", subItems: [
        { id: "usuarios-roles", label: 'menu.admin.settings.users_roles', link: "/config/usuarios", parentId: "admin-config" },
        { id: "idioma", label: 'menu.admin.settings.language', link: "/config/idioma", parentId: "admin-config", icon: "ri-time-line", disabled: true, badgeName: "Coming Soon", badgeColor: "info" }
    ] }
];

export default Navdata;
export { menuData };