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

    // Get user data from Login slice
    const loginData = createSelector(
        (state: any) => state.Login,
        (login) => login.user
    );
    const userData = useSelector(loginData);

    const [userName, setUserName] = useState("Admin");
    const [userRole, setUserRole] = useState("Administrator");
    const [userInitials, setUserInitials] = useState("AD");
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        // Get user data from Redux state (Login.user)
        // userData is the user object directly, not wrapped in another user property
        if (userData && Object.keys(userData).length > 0) {
            
            // Set user name
            setUserName(userData.name || userData.username || "Admin");
            
            // Set user email
            setUserEmail(userData.email || "");
            
            // Set user role - capitalize first letter
            const role = userData.role || "user";
            setUserRole(role.charAt(0).toUpperCase() + role.slice(1));
            
            // Set user initials (use the initials from API if available)
            setUserInitials(userData.initials || "AD");
            
            // Set user avatar
            setUserAvatar(userData.avatar || null);
        }
    }, [userData]);

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
                        {userAvatar ? (
                            <img 
                                className="rounded-circle header-profile-user" 
                                src={userAvatar} 
                                alt={userName}
                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div 
                                className="rounded-circle header-profile-user d-flex align-items-center justify-content-center bg-primary text-white fw-medium" 
                                style={{ width: '32px', height: '32px', fontSize: '14px' }}
                            >
                                {userInitials}
                            </div>
                        )}
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{userName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{userRole}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">{t('profile_dropdown.welcome')} {userName}!</h6>
                    {userEmail && (
                        <div className="dropdown-header pb-0">
                            <small className="text-muted">{userEmail}</small>
                        </div>
                    )}
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