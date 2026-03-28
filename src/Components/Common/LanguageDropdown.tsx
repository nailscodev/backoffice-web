import React, { useEffect, useState } from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

//i18n
import i18n from "../../i18n";
import languages from "../../common/languages";


const LanguageDropdown = () => {
    // Declare a new state variable, which we'll call "menu"
    const [selectedLang, setSelectedLang] = useState("");

    useEffect(() => {
        const currentLanguage : any = localStorage.getItem("I18N_LANGUAGE");
        setSelectedLang(currentLanguage);
    }, []);

    const changeLanguageAction = (lang : any) => {
        //set language as i18n
        i18n.changeLanguage(lang);
        localStorage.setItem("I18N_LANGUAGE", lang);
        setSelectedLang(lang);
    };


    const [isLanguageDropdown, setIsLanguageDropdown] = useState<boolean>(false);
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdown(!isLanguageDropdown);
    };

    const languageKeys = Object.keys(languages) as Array<keyof typeof languages>;
    const selectedLangKey = ((selectedLang in languages ? selectedLang : "en") as keyof typeof languages);
    return (
        <React.Fragment>
            <Dropdown isOpen={isLanguageDropdown} toggle={toggleLanguageDropdown} className="ms-1 topbar-head-dropdown header-item">
                <DropdownToggle className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" tag="button">
                    <img
                        src={languages[selectedLangKey].flag}
                        alt="Header Language"
                        height="20"
                        className="rounded"
                    />
                </DropdownToggle>
                <DropdownMenu className="notify-item language py-2">
                    {languageKeys.map(key => {
                        const { flag, label } = languages[key];

                        return (
                            <DropdownItem
                                key={key}
                                onClick={() => changeLanguageAction(key)}
                                className={`notify-item ${selectedLang === key ? "active" : "none"
                                    }`}
                            >
                                <img
                                    src={flag}
                                    alt={label ?? ""}
                                    className="me-2 rounded"
                                    height="18"
                                />
                                <span className="align-middle">
                                    {label}
                                </span>
                            </DropdownItem>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default LanguageDropdown;