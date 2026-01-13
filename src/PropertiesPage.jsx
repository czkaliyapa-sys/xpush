
import Spinner from "./components/Spinner";
import { useLocation } from 'react-router-dom';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
import styles from "./style";
 



const PropertiesPage = () => {
  const location = useLocation();
 
return (
    <>
      <SEOMeta
        title="Properties - ItsXtraPush"
        description="Explore ItsXtraPush company properties and facilities. Coming soon with more details about our infrastructure."
        keywords="properties, facilities, company, infrastructure"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Properties"
        ogDescription="ItsXtraPush Properties"
        ogUrl={getCanonicalUrl(location.pathname)}
      />
  <div className="deep bg-primary w-full overflow-hidden">
    
  <div className={`${styles.paddingX} ${styles.flexCenter}`}>
    <div className={`${styles.boxWidth}`}>
            
      <section className="flex flex-col items-center text-center p-12">
    <h1 className="text-white text-6xl mb-8">Sorry, we are working on this page</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     <Spinner color='teal'/>
    </div>
  </section>
    </div>
  </div>
</div>
    </>

);

}

export default PropertiesPage;