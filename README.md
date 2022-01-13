<br />
<br />

1. [Overview](#Overview)
2. [기술스택](#기술스택)
3. [주요 개발 스펙](#주요-개발-스펙)

<br />
<br />

## 1. Overview
---
### 1) 프로젝트 개요    
* 스크롤 기반 애니메이션 효과를 다루는 프로젝트 수주를 대비하여 내부 R&amp;D 진행
* 스크롤 위치를 탐지하는 ScrollMagic Library, TweenMax 애니메이션 library와 함께 Canvas 를 사용해 보는 R&amp;D
* 해당 R&amp;D에서 직접 작업한 컴포넌트만 repo에 포함

> Demo URL : 


&nbsp;
### 2) 프로젝트 진행 환경 및 요건
* 팀 그리고 실 내부에 Canvas 사용 유경험자가 없는 환경에서 디자인 요건 상 Canvas 사용 필수
* `글로벌 대응`을 위한 확장성 고려 필요
* `반응형` UI 및 `웹접근성` 준수
* 크로스브라우징 범위: 최신 브라우저, IE11까지 대응

<br />
<br />

## 2. 기술스택
---
> Key Visual(KV) / Invert 컴포넌트 

  * **기술스택 관련** :    
    * 주요 외부 JS library로 `jQuery`, `TweenMax(GSAP)`, `ScrollMagic` 사용
    * 내부 공용 library으로는 PictureImg, PicturesLoaded 및 기타 util 코드 사용
  * **참여도 관련** :    
    * 2개 컴포넌트 관련 모든 HTML / SCSS / JS 작업 (외부 및 내부 library 제외)


<br />
<br />

## 3. 주요 개발 스펙
---
* **KV 컴포넌트**:    
  * 스크롤에 따라 중앙을 기점으로 텍스트가 zoom out 되면서 이미지만 보이던 상태에서 'Camera' 텍스트 노출 (텍스트 개행 미대응하며 상시 한줄 텍스트만 오는 UI)
  * 메인 텍스트가 변경되거나 다른 언어가 들어와 중앙 지점에 텍스트 영역이 없는 경우를 대비해서 컴포넌트의 최상위 HTML 태그에 좌측으로 offset값을 지정할 수 있도록 개발
  * HTML에 원하는 텍스트 기입 시 Canvas에 적용됨
  * 반응형으로 개발함에 따라 모바일 디바이스 해상도를 고려해 Canvas 그릴 수 있도록 개발
  
&nbsp;
* **Invert 컴포넌트**:    
  * 스크롤에 따라 배경의 검정색이 중앙지점부터 옆으로 커텐처럼 걷어지고 텍스트 색은 invert되는 애니메이션
  * 텍스트 개행되는 부분 계산하여 Canvas에서 멀티라인 텍스트 대응
  * 반응형으로 개발함에 따라 모바일 디바이스 해상도를 고려해 Canvas 그릴 수 있도록 개발

<br />
<br />