# RAUMHEIZLAST DIN EN 12831

**Projekt:** ID_115986 / Bespielprojekt – alle Räume
**Datum:** 01.01.2026


## Berechnungsparameter

- Auslegungs-Außentemperatur $\theta_{e}$ = -10,30 °C

---

## 1. Checkliste Vereinbarungen

| Geschoss | Nr. | Bezeichnung | Raumart | Innentemp. °C | Mindest-Außenluftwechsel $h^{-1}$ |
|:---|:---|:---|:---|:---|:---|
| DG | DG-R1 | Wohnraum Dach | Dach | 20,00 | 0,50 |
| OG1 | OG1-R1 | Schlafen | Schlafen | 20,00 | 0,50 |
| OG1 | OG1-R2 | Schlafen 2 | Schlafen | 20,00 | 0,50 |
| OG1 | OG1-R3 | Bad/Dusche/Umkl. | Bad | 24,00 | 0,50 |
| OG1 | OG1-R5 | Abstellraum | Abstellraum | 15,00 | - |
| EG | EG-R1 | Wohnraum | Wohnraum | 20,00 | 0,50 |
| EG | EG-R2 | Essen | Essen | 20,00 | 0,50 |
| EG | EG-R4 | WC-Raum | WC | 20,00 | 0,50 |
| EG | EG-R5 | Wohnraum 2 | Wohnraum | 20,00 | 0,50 |
| EG | EG-R6 | Wohnraum 3 | Wohnraum | 20,00 | 0,50 |

---


## 2. Zonenübersicht

| Geschoss | Nr. | Bezeichnung | Raumart | $A_{NGI}$ (m²) | $V_i$ (m³) | $\theta_i$ (°C) | $n_{min}$ ($h^{-1}$) | $\Phi_{T}$ (W) | $\Phi_{V}$ (W) | $\Phi_{HL}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| DG | DG-R1 | Wohnraum Dach | Dach | 36,76 | 68,37 | 20,00 | 0,50 | 1560 | 352 | **1912** |
| OG1 | OG1-R1 | Schlafen | Schlafen | 13,61 | 32,39 | 20,00 | 0,50 | 322 | 167 | **489** |
| OG1 | OG1-R2 | Schlafen 2 | Schlafen | 13,78 | 32,80 | 20,00 | 0,50 | 662 | 169 | **831** |
| OG1 | OG1-R3 | Bad/Dusche/Umkl. | Bad | 11,54 | 27,47 | 24,00 | 0,50 | 188 | 160 | **348** |
| OG1 | OG1-R5 | Abstellraum | Abstellraum | 6,31 | 13,06 | 15,00 | - | 418 | 0 | **418** |
| EG | EG-R1 | Wohnraum | Wohnraum | 27,41 | 65,24 | 20,00 | 0,50 | 1782 | 336 | **2118** |
| EG | EG-R2 | Essen | Essen | 16,62 | 39,56 | 20,00 | 0,50 | 487 | 204 | **691** |
| EG | EG-R4 | WC-Raum | WC | 3,92 | 9,33 | 20,00 | 0,50 | 772 | 48 | **820** |
| EG | EG-R5 | Wohnraum 2 | Wohnraum | 14,44 | 34,37 | 20,00 | 0,50 | 690 | 177 | **867** |
| EG | EG-R6 | Wohnraum 3 | Wohnraum | 14,60 | 34,75 | 20,00 | 0,50 | 997 | 179 | **1176** |

---

# RAUMHEIZLAST DIN EN 12831 — DG-R1 Wohnraum Dach
*Seite REG-DG-R1 (1/11)*

## Kopfangaben
- **Geschoss:** DG
- **Raum-Nr.:** DG-R1
- **Bezeichnung:** Wohnraum Dach

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 5,57 m |
| Raumlänge $l_i$ | 6,60 m |
| Raumfläche $A_{NGI}$ | 36,76 m² |
| Geschosshöhe $h_{G,i}$ | 2,06 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 1,86 m |
| Raumvolumen $V_i$ | 68,37 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 8,92 | 2,06 | 18,38 | - | 18,38 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 50 |
| W | AW (AW (Altbau)) | 8,92 | 2,06 | 18,38 | 0,60 | 17,78 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 808 |
| W | AF (AF (modern)) | 0,29 | 2,06 | 0,60 | - | 0,60 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 21 |
| N | DA (DA (Sparrendämmung)) | 6,60 | 4,02 | 26,53 | 0,60 | 25,93 | e | -10,30 | 1,00 | 0,30 | 0,10 | 0,40 | 314 |
| N | DF (DF (modern)) | 0,29 | 2,06 | 0,60 | - | 0,60 | e | -10,30 | 1,00 | 1,00 | 0,10 | 1,10 | 20 |
| S | DA (DA (Sparrendämmung)) | 6,60 | 4,02 | 26,53 | 1,20 | 25,33 | e | -10,30 | 1,00 | 0,30 | 0,10 | 0,40 | 307 |
| S | DF (DF (modern)) | 0,29 | 2,06 | 0,60 | - | 0,60 | e | -10,30 | 1,00 | 1,00 | 0,10 | 1,10 | 20 |
| S | DF (DF (modern)) | 0,29 | 2,06 | 0,60 | - | 0,60 | e | -10,30 | 1,00 | 1,00 | 0,10 | 1,10 | 20 |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **1560 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **34,2 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **352 W**
- $\Sigma \Phi_{V,stand,i}$ = **352 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **1912 W**

---

# RAUMHEIZLAST DIN EN 12831 — OG1-R1 Schlafen
*Seite REG-OG1-R1 (2/11)*

## Kopfangaben
- **Geschoss:** OG1
- **Raum-Nr.:** OG1-R1
- **Bezeichnung:** Schlafen

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 3,24 m |
| Raumlänge $l_i$ | 4,20 m |
| Raumfläche $A_{NGI}$ | 13,61 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 32,39 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 4,45 | 2,58 | 11,49 | - | 11,49 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 31 |
| N | AW (AW (Altbau)) | 3,58 | 2,58 | 9,23 | 1,00 | 8,23 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 374 |
| N | AF (AF (modern)) | 0,39 | 2,58 | 1,00 | - | 1,00 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 35 |
| S | IW (IW) | 3,58 | 2,58 | 9,23 | - | 9,23 | ij | 24,00 | 1,00 | 3,19 | - | 3,19 | -118 |
| H | DE | 3,24 | 4,20 | 13,61 | - | 13,61 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| H | FB | 3,24 | 4,20 | 13,61 | - | 13,61 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **322 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **16,2 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **167 W**
- $\Sigma \Phi_{V,stand,i}$ = **167 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **489 W**

---

# RAUMHEIZLAST DIN EN 12831 — OG1-R2 Schlafen 2
*Seite REG-OG1-R2 (3/11)*

## Kopfangaben
- **Geschoss:** OG1
- **Raum-Nr.:** OG1-R2
- **Bezeichnung:** Schlafen 2

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 3,28 m |
| Raumlänge $l_i$ | 4,20 m |
| Raumfläche $A_{NGI}$ | 13,78 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 32,80 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 4,45 | 2,58 | 11,49 | - | 11,49 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 31 |
| N | DA (DA (Sparrendämmung)) | 3,83 | 2,58 | 9,89 | - | 9,89 | e | -10,30 | 1,00 | 0,30 | 0,10 | 0,40 | 120 |
| W | AW (AW (Altbau)) | 3,87 | 2,58 | 9,99 | 1,50 | 8,49 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 386 |
| W | AF (AF (modern)) | 0,58 | 2,58 | 1,50 | - | 1,50 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 52 |
| S | IW (IW) | 0,73 | 2,58 | 1,89 | - | 1,89 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| S | IW (IW) | 2,44 | 2,58 | 6,29 | 1,70 | 4,59 | ij | 15,00 | 1,00 | 3,19 | - | 3,19 | 73 |
| H | DE | 3,28 | 4,20 | 13,78 | - | 13,78 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| H | FB | 3,28 | 4,20 | 13,78 | - | 13,78 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **662 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **16,4 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **169 W**
- $\Sigma \Phi_{V,stand,i}$ = **169 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **831 W**

---

# RAUMHEIZLAST DIN EN 12831 — OG1-R3 Bad/Dusche/Umkl.
*Seite REG-OG1-R3 (4/11)*

## Kopfangaben
- **Geschoss:** OG1
- **Raum-Nr.:** OG1-R3
- **Bezeichnung:** Bad/Dusche/Umkl.

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 24,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **24,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 3,70 m |
| Raumlänge $l_i$ | 3,12 m |
| Raumfläche $A_{NGI}$ | 11,54 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 27,47 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 2,88 | 2,58 | 7,43 | - | 7,43 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 29 |
| N | IW (IW) | 3,41 | 2,58 | 8,81 | - | 8,81 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| W | IW (IW) | 2,88 | 2,58 | 7,43 | - | 7,43 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| S | AW (AW (Altbau)) | 1,29 | 2,58 | 3,33 | 1,03 | 2,30 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 118 |
| S | AF (AF (modern)) | 0,40 | 2,58 | 1,03 | - | 1,03 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 41 |
| H | DE | 3,70 | 3,12 | 11,54 | - | 11,54 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| H | FB | 3,70 | 3,12 | 11,54 | - | 11,54 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **188 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **13,7 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **160 W**
- $\Sigma \Phi_{V,stand,i}$ = **160 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **348 W**

---

# RAUMHEIZLAST DIN EN 12831 — OG1-R5 Abstellraum
*Seite REG-OG1-R5 (5/11)*

## Kopfangaben
- **Geschoss:** OG1
- **Raum-Nr.:** OG1-R5
- **Bezeichnung:** Abstellraum

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 15,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **15,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 1,83 m |
| Raumlänge $l_i$ | 3,45 m |
| Raumfläche $A_{NGI}$ | 6,31 m² |
| Geschosshöhe $h_{G,i}$ | 2,27 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,07 m |
| Raumvolumen $V_i$ | 13,06 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 1,67 | 2,27 | 3,79 | - | 3,79 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 5 |
| N | IW (IW) | 3,15 | 2,27 | 7,14 | 1,50 | 5,64 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| S | AW (AW (Altbau)) | 3,15 | 2,27 | 7,14 | 1,50 | 5,64 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 214 |
| S | AF (AF (modern)) | 0,66 | 2,27 | 1,50 | - | 1,50 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 44 |
| H | DE | 1,83 | 3,45 | 6,31 | - | 6,31 | e | -10,30 | 1,00 | 0,97 | - | 0,97 | 155 |
| H | FB | 1,83 | 3,45 | 6,31 | - | 6,31 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **418 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **0,0 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **0 W**
- $\Sigma \Phi_{V,stand,i}$ = **0 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **418 W**

---

# RAUMHEIZLAST DIN EN 12831 — EG-R1 Wohnraum
*Seite REG-EG-R1 (6/11)*

## Kopfangaben
- **Geschoss:** EG
- **Raum-Nr.:** EG-R1
- **Bezeichnung:** Wohnraum

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 4,11 m |
| Raumlänge $l_i$ | 6,67 m |
| Raumfläche $A_{NGI}$ | 27,41 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 65,24 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 4,37 | 2,58 | 11,27 | - | 11,27 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 31 |
| N | AW (AW (Altbau)) | 7,27 | 2,58 | 18,76 | 3,40 | 15,36 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 698 |
| N | AF (AF (modern)) | 1,32 | 2,58 | 3,40 | - | 3,40 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 118 |
| W | AW (AW (Altbau)) | 4,37 | 2,58 | 11,27 | 1,60 | 9,67 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 440 |
| W | AF (AF (modern)) | 0,62 | 2,58 | 1,60 | - | 1,60 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 56 |
| S | IW (IW) | 7,27 | 2,58 | 18,76 | - | 18,76 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| H | DE | 4,11 | 6,67 | 27,41 | - | 27,41 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| H | FB | 4,11 | 6,67 | 27,41 | - | 27,41 | e | 10,00 | 1,00 | 1,60 | - | 1,60 | 439 |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **1782 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **32,6 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **336 W**
- $\Sigma \Phi_{V,stand,i}$ = **336 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **2118 W**

---

# RAUMHEIZLAST DIN EN 12831 — EG-R2 Essen
*Seite REG-EG-R2 (7/11)*

## Kopfangaben
- **Geschoss:** EG
- **Raum-Nr.:** EG-R2
- **Bezeichnung:** Essen

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 5,13 m |
| Raumlänge $l_i$ | 3,24 m |
| Raumfläche $A_{NGI}$ | 16,62 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 39,56 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 5,18 | 2,58 | 13,36 | - | 13,36 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 36 |
| W | AW (AW (Altbau)) | 1,70 | 2,58 | 4,39 | 1,40 | 2,99 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 136 |
| W | AF (AF (modern)) | 0,54 | 2,58 | 1,40 | - | 1,40 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 49 |
| N | IW (IW) | 3,55 | 2,58 | 9,16 | 1,60 | 7,56 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| S | IW (IW) | 3,49 | 2,58 | 9,00 | 1,90 | 7,10 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| H | DE | 5,13 | 3,24 | 16,62 | - | 16,62 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| H | FB | 5,13 | 3,24 | 16,62 | - | 16,62 | e | 10,00 | 1,00 | 1,60 | - | 1,60 | 266 |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **487 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **19,8 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **204 W**
- $\Sigma \Phi_{V,stand,i}$ = **204 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **691 W**

---

# RAUMHEIZLAST DIN EN 12831 — EG-R4 WC-Raum
*Seite REG-EG-R4 (8/11)*

## Kopfangaben
- **Geschoss:** EG
- **Raum-Nr.:** EG-R4
- **Bezeichnung:** WC-Raum

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 1,80 m |
| Raumlänge $l_i$ | 2,18 m |
| Raumfläche $A_{NGI}$ | 3,92 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 9,33 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 3,04 | 2,58 | 7,84 | - | 7,84 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 21 |
| N | IW (IW) | 1,80 | 2,58 | 4,64 | - | 4,64 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| W | AW (AW (Altbau)) | 3,04 | 2,58 | 7,84 | - | 7,84 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 356 |
| S | AW (AW (Altbau)) | 1,60 | 2,58 | 4,14 | 0,50 | 3,64 | e | -10,30 | 1,00 | 1,40 | 0,10 | 1,50 | 165 |
| S | AF (AF (modern)) | 0,19 | 2,58 | 0,50 | - | 0,50 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 17 |
| H | BA (BA (Altbau)) | 1,80 | 2,18 | 3,90 | - | 3,90 | e | -10,30 | 1,00 | 1,70 | 0,10 | 1,80 | 213 |
| H | DE | 1,80 | 2,18 | 3,92 | - | 3,92 | ij | 20,00 | - | 0,97 | - | 0,97 | - |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **772 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **4,7 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **48 W**
- $\Sigma \Phi_{V,stand,i}$ = **48 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **820 W**

---

# RAUMHEIZLAST DIN EN 12831 — EG-R5 Wohnraum 2
*Seite REG-EG-R5 (9/11)*

## Kopfangaben
- **Geschoss:** EG
- **Raum-Nr.:** EG-R5
- **Bezeichnung:** Wohnraum 2

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 3,23 m |
| Raumlänge $l_i$ | 4,47 m |
| Raumfläche $A_{NGI}$ | 14,44 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 34,37 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 6,86 | 2,58 | 17,70 | - | 17,70 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 48 |
| N | IW (IW) | 2,82 | 2,58 | 7,28 | 1,90 | 5,38 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| W | AW (AW (Altbau)) | 3,71 | 2,58 | 9,56 | 2,60 | 6,96 | e | -10,30 | 1,00 | 0,80 | 0,10 | 0,90 | 190 |
| W | AF (AF (modern)) | 0,50 | 2,58 | 1,30 | - | 1,30 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 45 |
| W | AF (AF (modern)) | 0,50 | 2,58 | 1,30 | - | 1,30 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 45 |
| S | IW (IW) | 3,13 | 2,58 | 8,07 | 1,90 | 6,17 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| H | DE | 3,23 | 4,47 | 14,44 | - | 14,44 | e | -10,30 | 1,00 | 0,30 | - | 0,30 | 131 |
| H | FB | 3,23 | 4,47 | 14,44 | - | 14,44 | e | 10,00 | 1,00 | 1,60 | - | 1,60 | 231 |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **690 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **17,2 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **177 W**
- $\Sigma \Phi_{V,stand,i}$ = **177 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **867 W**

---

# RAUMHEIZLAST DIN EN 12831 — EG-R6 Wohnraum 3
*Seite REG-EG-R6 (10/11)*

## Kopfangaben
- **Geschoss:** EG
- **Raum-Nr.:** EG-R6
- **Bezeichnung:** Wohnraum 3

## Auslegungsinnentemperatur
- $\theta_{i,stand,i}$ = 20,00 °C
- $+ \Delta\theta_{comf,i}$ = 0,00 K
- $\theta_{i,ausleg,i}$ = **20,00 °C**

## Abmessungen
| Größe | Wert |
|:---|:---|
| Raumbreite $b_i$ | 3,23 m |
| Raumlänge $l_i$ | 4,52 m |
| Raumfläche $A_{NGI}$ | 14,60 m² |
| Geschosshöhe $h_{G,i}$ | 2,58 m |
| Deckendicke $d_i$ | 0,20 m |
| Raumhöhe $h_i$ | 2,38 m |
| Raumvolumen $V_i$ | 34,75 m³ |

## Standard-Transmissionswärmeverlust

| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\Delta U_{TB}$ | $U_{korr}$ | $\Phi_{T,k}$ (W) |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| O | HTW (HTW (DHH)) | 4,97 | 2,58 | 12,81 | - | 12,81 | ij | 10,90 | 1,00 | 0,30 | - | 0,30 | 35 |
| N | IW (IW) | 3,13 | 2,58 | 8,07 | 1,90 | 6,17 | ij | 20,00 | - | 3,19 | - | 3,19 | - |
| W | AW (AW (Altbau)) | 4,46 | 2,58 | 11,51 | 1,30 | 10,21 | e | -10,30 | 1,00 | 0,80 | 0,10 | 0,90 | 278 |
| W | AF (AF (modern)) | 0,50 | 2,58 | 1,30 | - | 1,30 | e | -10,30 | 1,00 | 1,05 | 0,10 | 1,15 | 45 |
| S | AW (AW (Altbau)) | 3,86 | 2,58 | 9,97 | - | 9,97 | e | -10,30 | 1,00 | 0,80 | 0,10 | 0,90 | 272 |
| H | DE | 3,23 | 4,52 | 14,60 | - | 14,60 | e | -10,30 | 1,00 | 0,30 | - | 0,30 | 133 |
| H | FB | 3,23 | 4,52 | 14,60 | - | 14,60 | e | 10,00 | 1,00 | 1,60 | - | 1,60 | 234 |
| | | | | | | | | | | **$\Sigma \Phi_{T,stand,i}$** | | | **997 W** |

## Lüftung und Normheizlast

**Lüftungswärmeverluste:**
- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **17,4 m³/h**
- Leckagen, ALD, Mindestwert $\Phi_{V,env/min,i}$: **179 W**
- $\Sigma \Phi_{V,stand,i}$ = **179 W**

**Normheizlast $\Phi_{HL,i}$** = $\Phi_{T,stand,i}$ + $\Phi_{V,stand,i}$ = **1176 W**

---


## Ergebnis Zusammenstellung Nutzungseinheiten

| Nr. | Bezeichnung | $\Sigma \Phi_{T}$ (W) | $\Sigma \Phi_{V}$ (W) | **Normheizlast (W)** |
|:---|:---|:---|:---|:---|
| 5 | Wohneinheit 1 | **7878** | **1792** | **9670** |
| **Summe** | **Gebäude gesamt** | **7878** | **1792** | **9670** |
