import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";

const ProfileDropdown = () => {

    const { t } = useTranslation();

    const profiledropdownData = createSelector(
        (state: any) => state.Profile,
        (user) => user.user
    );
    // Inside your component
    const user = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("Admin");
    const [userRole, setUserRole] = useState("Administrator"); // TODO: Get from user data
    const [userInitials, setUserInitials] = useState("AD");

    useEffect(() => {
        const authUser = sessionStorage.getItem("authUser");
        if (authUser) {
            const obj = JSON.parse(authUser);
            
            let firstName = "";
            let lastName = "";
            
            if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
                firstName = user.first_name || obj.data?.first_name || obj.first_name || "";
                lastName = user.last_name || obj.data?.last_name || obj.last_name || "";
                setUserName(firstName || "Admin");
            } else if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
                const displayName = obj.displayName || obj.email || "Admin";
                setUserName(displayName);
                firstName = displayName.split(" ")[0] || "";
                lastName = displayName.split(" ")[1] || "";
            } else {
                setUserName("Admin");
                firstName = "Ad";
                lastName = "min";
            }
            
            // Generate initials
            const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            setUserInitials(initials || "AD");
            
            // TODO: Get user role from obj or user data
            // setUserRole(obj.role || user.role || "Administrator");
        }
    }, [userName, user]);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <div className="rounded-circle header-profile-user d-flex align-items-center justify-content-center bg-primary text-white fw-medium" 
                             style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                            {userInitials}
                        </div>
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text"> {userName || "Admin"}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{userRole}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">{t('profile_dropdown.welcome')} {userName}!</h6>
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">{t('profile_dropdown.profile')}</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile-settings?tab=password" className="dropdown-item">
                            <i className="mdi mdi-key-variant text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">{t('profile_dropdown.change_password')}</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/auth-lockscreen-basic" className="dropdown-item">
                            <i className="mdi mdi-lock text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">{t('profile_dropdown.lock_screen')}</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle" data-key="t-logout">{t('profile_dropdown.logout')}</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;