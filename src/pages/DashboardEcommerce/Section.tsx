import React, { useState } from 'react';
import { Col, Row } from 'reactstrap';
import Flatpickr from "react-flatpickr";
import { useTranslation } from 'react-i18next';

const Section = (props:any) => {
    // compute start (Monday) and end (Sunday) of the current week dynamically
    const getWeekRange = (d: Date) => {
        const date = new Date(d);
        // treat Monday as first day of week
        const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
        const diffToMonday = (day + 6) % 7; // days since Monday
        const start = new Date(date);
        start.setDate(date.getDate() - diffToMonday);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
        return { start, end };
    };

    const today = new Date();
    const { start: weekStart, end: weekEnd } = getWeekRange(today);
    const [dateRange, setDateRange] = useState<Date[]>([weekStart, weekEnd]);
    const { t } = useTranslation();

    const startDate = dateRange && dateRange.length > 0 ? dateRange[0] : weekStart;
    const endDate = dateRange && dateRange.length > 1 ? dateRange[1] : (dateRange && dateRange.length === 1 ? dateRange[0] : weekEnd);

    const startLabel = startDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const endLabel = endDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <React.Fragment>
            <Row className="mb-3 pb-1">
                <Col xs={12}>
                    <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                        <div className="flex-grow-1">
                            <h4 className="fs-16 mb-1">Good Morning!</h4>
                            <p className="text-muted mb-0">{t('dashboard.section.range_text', "Here's what's happening between {{start}} and {{end}}.", { start: startLabel, end: endLabel })}</p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <form action="#">
                                <Row className="g-3 mb-0 align-items-center">
                                    <div className="col-sm-auto">
                                        <div className="input-group">
                                            <Flatpickr
                                                className="form-control border-0 dash-filter-picker shadow"
                                                value={dateRange}
                                                options={{
                                                    mode: "range",
                                                    dateFormat: "d M, Y",
                                                    defaultDate: [weekStart, weekEnd]
                                                }}
                                                onChange={(selected: any) => setDateRange(selected)}
                                            />
                                            <div className="input-group-text bg-primary border-primary text-white"><i className="ri-calendar-2-line"></i></div>
                                        </div>
                                    </div>
                                    {/* <div className="col-auto">
                                        <button type="button" className="btn btn-soft-success"><i className="ri-add-circle-line align-middle me-1"></i> Add Product</button>
                                    </div> */}
                                    {/* <div className="col-auto">
                                        <button type="button" className="btn btn-soft-info btn-icon waves-effect waves-light layout-rightside-btn" onClick={props.rightClickBtn} ><i className="ri-pulse-line"></i></button>
                                    </div> */}
                                </Row>
                            </form>
                        </div>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default Section;