```mermaid
graph LR;
    A["C# Data Acquisition"]-->B["Data Storage"]
    B-->C["Python Analysis Engine"]
    C-->D["Anomaly Detection"]
    C-->E["Predictive Maintenance"]
    C-->F["Quality Prediction"]
    D-->G["Analysis Results API"]
    E-->G
    F-->G
    G-->H["C# Control System"]
    H-->I["Operator Alerts"]
    H-->J["Maintenance Scheduling"]
    H-->K["Process Optimization"]
    
    style A fill:#0275d8
    style H fill:#0275d8
    style I fill:#0275d8
    style J fill:#0275d8
    style K fill:#0275d8
    style C fill:#d3f8e2
    style D fill:#d3f8e2
    style E fill:#d3f8e2
    style F fill:#d3f8e2
    style G fill:#d3f8e2
```