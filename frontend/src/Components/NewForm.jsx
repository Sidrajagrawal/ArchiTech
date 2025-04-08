import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewForm.css";
import back1 from "../image/FormBack/back1.webp";
import back4 from "../image/FormBack/back4.jpg";
import back5 from "../image/FormBack/back5.jpg";
import back7 from "../image/FormBack/back7.jpg";
import back9 from "../image/FormBack/back9.jpg";

const images = [back1, back4, back5, back7, back9];

const NewForm = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [active, setActive] = useState(false);
    const [isAIOptimize, setIsAIOptimize] = useState(false); // ✅ New state for AI optimization
    const [formData, setFormData] = useState({
        house_type: "",
        total_land_dimension: "",
        guest_room_dimension: "",
        living_room_dimension: "",
        garage_dimension: "",
        kitchen_dimension: "",
        balcony_dimension: "",
        dining_room_dimension: "",
        foyer_dimension: "",
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleHouseTypeSelection = (type) => {
        setActive(true);
        setIsAIOptimize(false); // ✅ Reset AI Optimize state when selecting house type
        setFormData((prevData) => ({ ...prevData, house_type: type }));
    };

    const handleAIOptimizeClick = () => {
        setIsAIOptimize(true); // ✅ Show only "Total Land Dimension" field
        setActive(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);

        const newTab = window.open("", "_blank");

            try {
                const response = await axios.post(
                    "http://localhost:8000/generate-house-map/",
                    formData,
                    { headers: { "Content-Type": "application/json" } }
                );
    
                if (response.data.image_url) {
                    newTab.location.href = response.data.image_url;
                } else {
                    newTab.close();
                    alert("Failed to retrieve image URL");
                }
            } catch (error) {
                newTab.close();
                console.error("Error:", error);
                alert("Failed to generate floor plan");
            }
        

    };

    return (
        <div className="NewFormMain" style={{ backgroundImage: `url(${images[currentIndex]})` }}>
            <div className="blacktined">
                <div className="form-container">
                    <button className="Dim1" onClick={() => setIsAIOptimize(false)}>Manual Dimensions</button>
                    <button className="Dim2" onClick={handleAIOptimizeClick}>AI Optimize Dimensions</button>

                    {active ? (
                        <form className="form-container1">
                            <table className="form-table">
                                <tbody>
                                    {/* ✅ Show only "Total Land Dimension" if AI Optimize is active */}
                                    {isAIOptimize ? (
                                        <tr>
                                            <td className="icon-cell">
                                                <i className="fa-solid fa-warehouse"></i>
                                            </td>
                                            <td>
                                                <label>Total Land Dimension *</label>
                                            </td>
                                            <td className="input-cell">
                                                <input
                                                    type="text"
                                                    name="total_land_dimension"
                                                    placeholder="00 x 00"
                                                    value={formData.total_land_dimension}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        // ✅ Show full form when AI Optimize is OFF
                                        [
                                            "Total Land",
                                            "Guest Room",
                                            "Living Room",
                                            "Garage",
                                            "Kitchen",
                                            "Balcony",
                                            "Dining Room",
                                            "Foyer",
                                        ].map((room, index) => (
                                            <tr key={index}>
                                                <td className="icon-cell">
                                                    <i className="fa-solid fa-warehouse"></i>
                                                </td>
                                                <td>
                                                    <label>
                                                        {room} Dimension {room === "Total Land" ? "*" : ""}
                                                    </label>
                                                </td>
                                                <td className="input-cell">
                                                    <input
                                                        type="text"
                                                        name={room.toLowerCase().replace(/\s+/g, "_") + "_dimension"}
                                                        placeholder="00 x 00"
                                                        value={formData[room.toLowerCase().replace(/\s+/g, "_") + "_dimension"] || ""}
                                                        onChange={handleChange}
                                                        required={room === "Total Land"}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </form>
                    ) : (
                        <div className="Button-container1">
                            <div className="Btton-inside-1">
                                <button onClick={() => handleHouseTypeSelection("Villa")}>Villa</button>
                                <button onClick={() => handleHouseTypeSelection("Standard House")}>Standard</button>
                            </div>
                            <div className="Btton-inside-2">
                                <button onClick={() => handleHouseTypeSelection("Luxury House")}>Luxury</button>
                                <button onClick={() => handleHouseTypeSelection("Studio")}>Studio</button>
                            </div>
                        </div>
                    )}

                    <button className="submit-button" onClick={handleSubmit}>Generate Plan</button>
                </div>
            </div>
        </div>
    );
};

export default NewForm;
