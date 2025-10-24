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
                    id: "listado-turnos",
                    label: t('menu.admin.reservations.list'),
                    link: "/reservas/listado",
                    parentId: "admin-reservas",
                    isChildItem: true,
                },
                { id: "vista-calendario", label: t('menu.admin.reservations.calendar_view'), link: "/reservas/calendario", parentId: "admin-reservas" },
            ],
        },

        // 4) Clientes
        {
            id: "admin-clientes",
            label: t('menu.admin.customers.title'),
            icon: "ri-group-line",
            link: "/clientes",
            click: function (e: any) {
                e.preventDefault();
                setIsClientes(!isClientes);
                setIscurrentState('Clientes');
                updateIconSidebar(e);
            },
            stateVariables: isClientes,
            subItems: [
                { id: "registro-cliente", label: t('menu.admin.customers.register'), link: "/clientes/registro", parentId: "admin-clientes" },
                { id: "filtros-clientes", label: t('menu.admin.customers.filters'), link: "/clientes/filtros", parentId: "admin-clientes" },
                { id: "historial-cliente", label: t('menu.admin.customers.history'), link: "/clientes/historial", parentId: "admin-clientes" },
            ],
        },

        // 5) Servicios
        {
            id: "admin-servicios",
            label: t('menu.admin.services.title'),
            icon: "ri-scissors-line",
            link: "/servicios",
            click: function (e: any) {
                e.preventDefault();
                setIsServicios(!isServicios);
                setIscurrentState('Servicios');
                updateIconSidebar(e);
            },
            stateVariables: isServicios,
            subItems: [
                { id: "servicios-list", label: t('menu.admin.services.list'), link: "/servicios", parentId: "admin-servicios" },
                { id: "addons", label: t('menu.admin.services.addons'), link: "/servicios/addons", parentId: "admin-servicios" },
                { id: "acciones-servicios", label: t('menu.admin.services.actions'), link: "/servicios/acciones", parentId: "admin-servicios" },
            ],
        },

        // 6) Profesionales / Staff
        {
            id: "admin-staff",
            label: t('menu.admin.staff.title'),
            icon: "ri-user-3-line",
            link: "/staff",
            click: function (e: any) {
                e.preventDefault();
                setIsStaffSection(!isStaffSection);
                setIscurrentState('Staff');
                updateIconSidebar(e);
            },
            stateVariables: isStaffSection,
            subItems: [
                { id: "staff-registro", label: t('menu.admin.staff.basic_register'), link: "/staff/registro", parentId: "admin-staff" },
                { id: "staff-disponibilidad", label: t('menu.admin.staff.availability'), link: "/staff/disponibilidad", parentId: "admin-staff" },
                { id: "asignacion-turnos", label: t('menu.admin.staff.shift_assignment'), link: "/staff/asignacion", parentId: "admin-staff" },
            ],
        },

        // 7) Reportes
        {
            id: "admin-reportes",
            label: t('menu.admin.reports.title'),
            icon: "ri-bar-chart-line",
            link: "/reportes",
            click: function (e: any) {
                e.preventDefault();
                setIsReportes(!isReportes);
                setIscurrentState('Reportes');
                updateIconSidebar(e);
            },
            stateVariables: isReportes,
            subItems: [
                { id: "reportes-fecha", label: t('menu.admin.reports.by_date'), link: "/reportes/fecha", parentId: "admin-reportes" },
                { id: "reportes-metrics", label: t('menu.admin.reports.metrics'), link: "/reportes/metrics", parentId: "admin-reportes" },
            ],
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
                { id: "usuarios-roles", label: t('menu.admin.settings.users_roles'), link: "/config/usuarios-roles", parentId: "admin-config" },
                { id: "auth-config", label: t('menu.admin.settings.authentication'), link: "/config/autenticacion", parentId: "admin-config" },
                { id: "idioma", label: t('menu.admin.settings.language'), link: "/config/idioma", parentId: "admin-config" },
            ],
        }
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;